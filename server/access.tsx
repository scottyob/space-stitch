import { Address4, Address6 } from "ip-address";
import { headers } from "next/headers";

export function isSuperuser(): boolean {
  // Get the headers from the server
  const hdr = Object.fromEntries(headers().entries());

  // If no x-forwarded-for, give up.
  if (Object.keys(hdr).indexOf("x-forwarded-for") == -1) {
    return false;
  }

  const addressStr = hdr["x-forwarded-for"];

  // Parse the IP addresses
  let addr4 = undefined;
  let addr6 = undefined;
  try {
    addr4 = new Address4(addressStr);
  } catch {
    addr6 = new Address6(addressStr);
    addr4 = addr6.address4;
  }

  // Check if the addresses are on a local network....
  // yeah this is terrible but will do for now!
  if (addr4) {
    if (
      addr4.isInSubnet(new Address4("127.0.0.0/8")) ||
      addr4.isInSubnet(new Address4("10.0.0.0/8")) ||
      addr4.isInSubnet(new Address4("172.16.0.0/12")) ||
      addr4.isInSubnet(new Address4("192.168.0.0/16"))
    ) {
      return true;
    }
  } else if (addr6?.getScope() === "Link Local") {
    return true;
  }

  // False by default
  return false;
}
