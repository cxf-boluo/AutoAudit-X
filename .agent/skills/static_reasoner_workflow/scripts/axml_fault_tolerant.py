import struct
import sys
import os

def read_int(data, offset):
    if offset + 4 > len(data): return 0
    return struct.unpack('<I', data[offset:offset+4])[0]

def read_short(data, offset):
    if offset + 2 > len(data): return 0
    return struct.unpack('<H', data[offset:offset+2])[0]

def parse_string(data, string_offsets, string_pool_offset, index, is_utf8):
    if index == 0xFFFFFFFF or index >= len(string_offsets):
        return ""
    off = string_pool_offset + string_offsets[index]
    if off >= len(data):
        return "[OBFUSCATED]"
    
    try:
        if is_utf8:
            length = data[off]
            if length & 0x80: off += 2
            else: off += 1
            length = data[off]
            if length & 0x80: off += 2
            else: off += 1
            s = data[off:off+length]
            return s.decode('utf-8', 'ignore')
        else:
            length = read_short(data, off)
            if length & 0x8000: off += 4
            else: off += 2
            s = data[off:off+length*2]
            return s.decode('utf-16le', 'ignore')
    except Exception:
        return "[DECODE_ERROR]"

def parse_axml_fault_tolerant(filepath, outpath):
    with open(filepath, 'rb') as f:
        data = f.read()

    # Skip 8-byte AXML File Header
    offset = 8
    
    # 1. StringPool Chunk
    sp_size = read_int(data, offset+4)
    str_count = read_int(data, offset+8)
    flags = read_int(data, offset+16)
    str_offset = read_int(data, offset+20)
    
    is_utf8 = (flags & 0x100) != 0

    string_offsets = []
    p = offset + 28
    for i in range(str_count):
        # Prevent allocation OOM on spoofed sizes
        if len(string_offsets) > 50000: break
        string_offsets.append(read_int(data, p))
        p += 4
        
    string_pool_data_offset = offset + str_offset
    
    strings = []
    for i in range(len(string_offsets)):
        strings.append(parse_string(data, string_offsets, string_pool_data_offset, i, is_utf8))

    xml_output = ['<?xml version="1.0" encoding="utf-8"?>']
    indent = 0
    
    def attrs_to_str(attrs):
        return " ".join(f'{k}="{v}"' for k,v in attrs.items())

    # 2. Bruteforce scan for XML node chunks
    offset = 8 + 28 
    while offset < len(data) - 8:
        chunk_type = read_short(data, offset)
        header_size = read_short(data, offset+2)
        
        if chunk_type in (0x0102, 0x0103, 0x0104):
            pass
        else:
            offset += 1 # advance byte by byte!
            continue
        
        chunk_size = read_int(data, offset+4)
        if chunk_size == 0 or chunk_size > len(data): 
            offset += 1
            continue
            
        if chunk_type == 0x0102: # START_TAG
            name_idx = read_int(data, offset+20)
            name = strings[name_idx] if name_idx < len(strings) else f"tag_{name_idx}"
            
            attr_count = read_short(data, offset+28)
            attr_offset = offset + 36 
            attrs = {}
            
            for i in range(attr_count):
                if attr_offset + 20 > len(data): break
                attr_ns_idx = read_int(data, attr_offset)
                attr_name_idx = read_int(data, attr_offset+4)
                attr_val_idx = read_int(data, attr_offset+8)
                val_type = data[attr_offset+15]
                val_data = read_int(data, attr_offset+16)
                
                attr_name = strings[attr_name_idx] if attr_name_idx < len(strings) else f"attr_{i}"
                if attr_val_idx != 0xFFFFFFFF and attr_val_idx < len(strings):
                    val_str = strings[attr_val_idx]
                else:
                    if val_type == 0x10 or val_type == 0x11: val_str = str(val_data)
                    elif val_type == 0x12: val_str = "true" if val_data != 0 else "false"
                    elif val_type == 0x01: val_str = f"@0x{val_data:08X}"
                    else: val_str = f"type{val_type:02X}_0x{val_data:08X}"
                
                ns = ""
                if attr_ns_idx != 0xFFFFFFFF and attr_ns_idx < len(strings):
                    ns_str = strings[attr_ns_idx]
                    if "android" in ns_str: ns = "android:"
                
                attrs[ns + attr_name] = val_str
                attr_offset += 20
                
            attr_text = attrs_to_str(attrs)
            xml_output.append("  " * indent + f"<{name} {attr_text}>")
            indent += 1
            
        elif chunk_type == 0x0103: # END_TAG
            name_idx = read_int(data, offset+20)
            name = strings[name_idx] if name_idx < len(strings) else f"tag_{name_idx}"
            indent -= 1
            if indent < 0: indent = 0
            xml_output.append("  " * indent + f"</{name}>")
            
        elif chunk_type == 0x0104: # TEXT
            text_idx = read_int(data, offset+16)
            if text_idx != 0xFFFFFFFF and text_idx < len(strings):
                text = strings[text_idx]
                xml_output.append("  " * indent + text)
                
        offset += chunk_size

    with open(outpath, 'w', encoding='utf-8') as f:
        f.write("\n".join(xml_output))
        
    print(f"[*] Bypass Parsing Complete! Structural XML saved to {outpath}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 axml_fault_tolerant.py <input_AndroidManifest.xml> <output_AndroidManifest.xml>")
        sys.exit(1)
    parse_axml_fault_tolerant(sys.argv[1], sys.argv[2])
