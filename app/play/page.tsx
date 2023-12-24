import dynamic from "next/dynamic";

export default async function Page() {

  const res = await dynamic(() => import('./player'), {
    ssr: false
  });
  // @ts-expect-error no idea why this is needed to be SSR disabled
  return res();

}
