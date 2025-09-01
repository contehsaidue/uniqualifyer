import { Link } from "@remix-run/react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Uniqualifyer</h3>
            <p className="text-gray-300 text-sm">
              Connecting students with their ideal academic programs through
              advanced matching algorithms and comprehensive university data.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  to="/explorer"
                  className="hover:text-white transition-colors"
                >
                  Program Explorer
                </Link>
              </li>
              <li>
                <Link
                  to="/universities"
                  className="hover:text-white transition-colors"
                >
                  Universities
                </Link>
              </li>
              <li>
                <Link
                  to="/programs"
                  className="hover:text-white transition-colors"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/login"
                  className="hover:text-white transition-colors"
                >
                  Access portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  Fourah Bay College <br /> University of Sierra Leone <br />{" "}
                  Freetown
                </span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>+232 (79) 497697</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>support@uniqualifyer.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 flex items-center">
            © {new Date().getFullYear()} Uniqualifyer. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <p className="text-sm text-gray-400 flex items-center">
              Made with{" "}
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              for students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
