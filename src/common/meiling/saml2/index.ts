export function getXMLNamespace(name: string): string {
  return 'urn:oasis:names:tc:SAML:2.0:' + name;
}

export function getNamespacePrefixedTagname(name: string): string {
  return 'saml:' + name;
}
