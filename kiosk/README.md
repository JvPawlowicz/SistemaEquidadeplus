# EquidadePlus – Modo Kiosk

Abre o EquidadePlus em **tela cheia (kiosk)** a partir de um executável, ideal para computadores fixos na empresa (recepção, consultório, etc.).

## Como usar

1. **Defina a URL do sistema**  
   Edite `main.js` e altere `APP_URL` para a URL do seu deploy (ex.: `https://equidadeplus.onrender.com`) ou use a variável de ambiente:
   - Windows (cmd): `set EQUIDADEPLUS_URL=https://sua-url.onrender.com && equidadeplus-kiosk.exe`
   - macOS/Linux: `EQUIDADEPLUS_URL=https://sua-url.onrender.com ./EquidadePlus\ Kiosk.app/Contents/MacOS/EquidadePlus\ Kiosk`

2. **Gerar o executável**

   ```bash
   cd kiosk
   npm install
   ```

   - **macOS (dmg):** `npm run build:mac`  
     Saída: `dist/EquidadePlus Kiosk-1.0.0.dmg`
   - **Windows (exe):** `npm run build:win`  
     Saída: `dist/EquidadePlus Kiosk Setup 1.0.0.exe`
   - **Os dois:** `npm run build`

3. **Testar sem build**  
   `npm start` — abre a janela em modo kiosk carregando a URL configurada.

## Ícones (opcional)

Coloque na pasta `kiosk`:
- `icon.icns` (macOS)
- `icon.ico` (Windows)

Se não existirem, o Electron usa o ícone padrão.

## Comportamento

- Janela em **fullscreen** e **kiosk** (sem barra de endereço, sem sair sem atalho).
- Para sair: **Alt+F4** (Windows) ou **Cmd+Q** (macOS) ou fechar pelo gerenciador de tarefas.
