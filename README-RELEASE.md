# Release

Este projeto distribui binários via GitHub Releases. O auto-update só aplica um
asset quando o binário da plataforma e o checksum SHA-256 correspondente estão
presentes no release.

## macOS arm64

```bash
deno task build
mv docmap-app docmap-macos-aarch64
shasum -a 256 docmap-macos-aarch64 > docmap-macos-aarch64.sha256

gh release create v1.1.0 \
  docmap-macos-aarch64 \
  docmap-macos-aarch64.sha256 \
  --title "v1.1.0" \
  --notes "Descrição das mudanças"
```

O nome do arquivo precisa seguir o padrão usado pelo app:

- macOS: `docmap-macos-aarch64`
- Linux: `docmap-linux-x86_64`
- Windows: `docmap-windows-x86_64`

Para releases com múltiplas plataformas, você também pode publicar um único
arquivo `SHA256SUMS` contendo uma linha por asset.
