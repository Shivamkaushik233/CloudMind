"""Package tracked/unignored source only, excluding release archives and secrets."""
import argparse
import hashlib
import subprocess
import zipfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=root/'releases/CloudMind-final-source.zip')
    args=parser.parse_args()
    result=subprocess.run(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root,check=True,capture_output=True)
    names=sorted(set(result.stdout.decode().split('\0'))-set(['']))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as archive:
        for name in names:
            path=root/name
            if not path.is_file() or name.startswith('releases/') or name.endswith(('.zip','.db','.log','.tsbuildinfo')):
                continue
            if any(part in {'.git','.venv','node_modules','.next','.secrets','__pycache__','.terraform','model-artifacts'} for part in path.relative_to(root).parts):
                continue
            if path.name.startswith('.env') and path.name != '.env.example':
                continue
            archive.write(path,'CloudMind/'+name)
    digest=hashlib.sha256(args.output.read_bytes()).hexdigest()
    args.output.with_suffix('.zip.sha256').write_text(digest+'  '+args.output.name+'\n')
    print(f'Created {args.output.name}; SHA-256 {digest}')


if __name__=='__main__':
    main()
