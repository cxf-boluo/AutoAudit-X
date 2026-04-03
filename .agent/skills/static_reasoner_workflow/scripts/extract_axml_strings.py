import re
import sys
import os

def extract_strings(manifest_path, out_path):
    try:
        with open(manifest_path, 'rb') as f:
            data = f.read()

        ascii_strs = re.findall(b'[\x20-\x7E]{5,}', data)
        utf16_strs = re.findall(b'(?:[\x20-\x7E]\x00){5,}', data)

        with open(out_path, 'w', encoding='utf-8') as out:
            out.write("========== AndroidManifest.xml Raw Strings From Obfuscated AXML ==========\n\n")
            out.write("--- UTF-16LE Strings (Common in AXML) ---\n")
            for s in utf16_strs:
                try:
                    out.write(s.decode('utf-16le') + "\n")
                except:
                    pass
            
            out.write("\n--- ASCII / UTF-8 Strings ---\n")
            for s in ascii_strs:
                try:
                    out.write(s.decode('ascii') + "\n")
                except:
                    pass
                    
        print(f"[*] Strings successfully extracted to {out_path}")
    except Exception as e:
        print(f"[!] Error extracting strings: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 extract_axml_strings.py <input_AndroidManifest.xml> <output_strings.txt>")
        sys.exit(1)
    extract_strings(sys.argv[1], sys.argv[2])
