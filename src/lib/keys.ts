// Generate an RSA (RS256) keypair in the browser via Web Crypto and export both
// halves as PEM. The public key goes into AgentOS `verification_keys`; the
// private key stays with whatever mints your JWTs. Nothing leaves the browser.

function toPem(buffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buffer)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const b64 = btoa(bin)
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

export async function generateRsaKeypair(): Promise<{
  publicKeyPem: string
  privateKeyPem: string
}> {
  const kp = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  )
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey)
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey)
  return {
    publicKeyPem: toPem(spki, 'PUBLIC KEY'),
    privateKeyPem: toPem(pkcs8, 'PRIVATE KEY')
  }
}
