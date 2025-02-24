import Image from "next/image";
import React from "react";

export default function Profile() {
  return (
    <Image src={"/images/profile.png"} alt="profile" width={40} height={40} />
  );
}
