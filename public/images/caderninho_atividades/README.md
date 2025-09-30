# Caderninho das Tarefas - Imagens Customizadas

Esta pasta contém as imagens customizadas enviadas pelos usuários no Caderninho das Tarefas.

## Estrutura:
- `v1.png` - Primeira imagem customizada
- `v2.svg` - Segunda imagem customizada
- `v3.jpg` - Terceira imagem customizada
- etc...

## Como funciona:
1. Usuário faz upload de uma imagem (SVG/PNG/JPG)
2. Sistema gera um nome versionado (v{N+1})
3. Imagem é salva temporariamente no localStorage
4. Em produção, seria salva nesta pasta via API

## Nota:
Por limitações do frontend, as imagens são mantidas no localStorage por enquanto.
Em um ambiente com backend, elas seriam salvas fisicamente nesta pasta.