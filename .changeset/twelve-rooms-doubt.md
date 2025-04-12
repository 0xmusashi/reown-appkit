---
'@nedykit/appkit-utils': patch
'@nedykit/appkit': patch
'@nedykit/appkit-adapter-bitcoin': patch
'@nedykit/appkit-adapter-ethers': patch
'@nedykit/appkit-adapter-ethers5': patch
'@nedykit/appkit-adapter-solana': patch
'@nedykit/appkit-adapter-wagmi': patch
'@nedykit/appkit-cdn': patch
'@nedykit/appkit-cli': patch
'@nedykit/appkit-common': patch
'@nedykit/appkit-controllers': patch
'@nedykit/appkit-core': patch
'@nedykit/appkit-experimental': patch
'@nedykit/appkit-polyfills': patch
'@nedykit/appkit-scaffold-ui': patch
'@nedykit/appkit-siwe': patch
'@nedykit/appkit-siwx': patch
'@nedykit/appkit-ui': patch
'@nedykit/appkit-wallet': patch
'@nedykit/appkit-wallet-button': patch
---

Fixes issue where switchin between appkit instances result network to be not detected as expected.

When AppKit initialized, if local storage active CAIP network value is something AppKit doesn't support, AppKit will redirect to first available network.
