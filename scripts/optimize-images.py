"""Refresh WebP copies without resizing originals. Requires Pillow; run before npm run build."""
from pathlib import Path
import hashlib
import json
import re
from PIL import Image

root = Path(__file__).resolve().parent.parent
manifest_path = root / 'scripts/image-optimization-manifest.json'
existing = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
mapping = existing.get('files', {})
sources = [root / name for name in ['index.html', 'case-atlas.html', 'case-b3.html', 'case-mercadopago.html', 'case-yampi.html']]
sources += list((root / 'components/v2').glob('*.html'))
text = '\n'.join(file.read_text() for file in sources)
for filename in set(re.findall(r'assets/images/[^"?<>\s]+\.png', text)):
    original = root / filename
    if original.exists() and original.stat().st_size >= 180000:
        mapping.setdefault(filename, str(Path(filename).with_suffix('.webp')))
versions = {}
for original, optimized in list(mapping.items()):
    with Image.open(root / original) as image:
        image.save(root / optimized, 'WEBP', quality=90, method=6)
    versions[optimized] = hashlib.sha256((root / optimized).read_bytes()).hexdigest()[:12]
for file in sources:
    content = file.read_text()
    for original, optimized in mapping.items():
        content = content.replace(original, optimized)
        content = re.sub(re.escape(optimized) + r'(?:\?v=[a-f0-9]+)?', optimized + '?v=' + versions[optimized], content)
    file.write_text(content)
manifest = {'quality':90, 'resized':False,
            'originalBytes':sum((root / name).stat().st_size for name in mapping),
            'optimizedBytes':sum((root / name).stat().st_size for name in mapping.values()),
            'files':dict(sorted(mapping.items()))}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f"{len(mapping)} images: {manifest['originalBytes']} -> {manifest['optimizedBytes']} bytes")
