import { Input } from "@/components/ui/input";
import Notification from "@/icons/Notification";
import Profile from "@/icons/Profile";
import ProofLogo from "@/icons/Proof";
import Settings from "@/icons/Settings";
import NavBar from "./NavBar";

export default function Header() {
  return (
    <div className="">
      <div className="flex flex-row justify-between px-[24px] py-[20px] w-full h-[88px] items-center">
        <div>
          <ProofLogo />
        </div>
        <div>
          <Input
            type="email"
            placeholder="Search here"
            className="w-[496px] h-[40px]"
          />
        </div>
        <div className="flex flex-row gap-[24px] justify-center items-center">
          <Settings />
          <Notification />
          <Profile />
        </div>
      </div>
      <NavBar />
    </div>
  );
}
