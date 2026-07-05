import Link from "next/link";
import { githubRepoUrl } from "@/lib/site/config";

const footerLinks = [
  { href: "/pricing", label: "가격" },
  { href: "/privacy", label: "개인정보 처리방침" },
  { href: "/terms", label: "이용약관" },
];

export function MarketingFooter() {
  return (
    <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
      <nav aria-label="마케팅 페이지 이동" className="flex flex-wrap gap-x-6 gap-y-2">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <a
          href={githubRepoUrl}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-foreground"
        >
          GitHub
        </a>
      </nav>
      <p className="mt-4 text-xs text-muted">
        © {new Date().getFullYear()} Prompt AI Studio
      </p>
    </footer>
  );
}
