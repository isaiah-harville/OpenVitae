import { Globe } from "lucide-react";
import type { IconType } from "react-icons";
// LinkedIn isn't in Simple Icons (trademark removal), so it comes from Font Awesome.
import { FaLinkedin } from "react-icons/fa6";
import {
  SiBluesky,
  SiGithub,
  SiGooglescholar,
  SiInstagram,
  SiMastodon,
  SiOrcid,
  SiX,
  SiYoutube,
} from "react-icons/si";

const ICONS: Record<string, IconType> = {
  github: SiGithub,
  x: SiX,
  linkedin: FaLinkedin,
  scholar: SiGooglescholar,
  orcid: SiOrcid,
  mastodon: SiMastodon,
  bluesky: SiBluesky,
  youtube: SiYoutube,
  instagram: SiInstagram,
};

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = ICONS[platform] ?? Globe;
  return <Icon className={className} />;
}
