"use client"

import Link from "next/link"
import { Github, Globe } from "lucide-react"
import { AuronLogo } from "@/components/auron-logo"
import { XIcon } from "@/components/icons/x-icon"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Deposit", href: "/deposit" },
    { name: "Stake", href: "/stake" },
    { name: "Rewards", href: "/rewards" },
    { name: "History", href: "/history" },
    { name: "Analytics", href: "/analytics" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Governance", href: "/governance" },
  ]

  const resources = [
    { name: "Documentation", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ]

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <AuronLogo size="sm" showText={true} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              A multi-wallet Web3 staking and governance platform on Ethereum. Connect with MetaMask, Rabby, Phantom, or
              TronLink — deposit, stake, vote, and track rewards in one place.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-brand transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-slate-400 hover:text-brand transition-colors">
                <XIcon />
                <span className="sr-only">X</span>
              </a>
              <a href="#" className="text-slate-400 hover:text-brand transition-colors">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Website</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Navigation</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-500 hover:text-brand transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Resources</h3>
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-slate-500 hover:text-brand transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Stay Updated</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Subscribe to our newsletter for the latest updates on Auron staking and governance.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-xl w-full focus:outline-none focus:ring-2 focus:ring-brand text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
              />
              <button className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-r-xl transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 md:mt-12 pt-6 md:pt-8 flex justify-center">
          <p className="text-slate-400 text-sm">
            &copy; {currentYear} Auron Governance Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
