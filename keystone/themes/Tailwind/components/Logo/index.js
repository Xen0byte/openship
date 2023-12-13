import { useRawKeystone } from "@keystone/keystoneProvider";
import Link from "next/link";
import { LogoIconSVG } from "@svg";

export const Logo = () => {
  const { adminConfig } = useRawKeystone();

  if (adminConfig.components?.Logo) {
    return <adminConfig.components.Logo />;
  }

  return (
    <h3>
      <Link href="/">
        <div className="flex items-center tracking-wide">
          <LogoIconSVG className="w-5 h-5 stroke-slate-500 mr-2" />
          <h1 className={`mb-1 text-2xl font-medium text-center`}>
            open
            <span className="font-light">ship</span>{" "}
          </h1>
        </div>
      </Link>
    </h3>
  );
};