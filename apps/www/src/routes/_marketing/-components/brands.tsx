import {
  AppleIcon,
  GoogleIcon,
  SolanaIcon,
} from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";

export function Brands() {
  return (
    <Section>
      <h2 className="text-center font-medium text-lg">By Ex Engineers from</h2>
      <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-80">
        <SolanaIcon className="size-14" />
        <GoogleIcon className="size-10" />
        <AppleIcon className="size-10" />
      </div>
    </Section>
  );
}

export default Brands;
