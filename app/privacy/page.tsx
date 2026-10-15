import { InfoPage } from "@/components/info-page";
import { publicPage } from "@/lib/seo";

export const metadata = publicPage("/privacy", "Privacy Policy", "How this ZEVORA preview handles information on your device.");

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy">
      <p>
        This preview does not run an account system, a payment provider, or an email service. The bag, wishlist, newsletter signup, and contact form are saved in your browser’s local storage. They are not sent to ZEVORA.
      </p>
      <p>
        Passwords typed on the account page are checked for length and then discarded. They are not written to storage.
      </p>
      <p>
        If you join the list, we ask for an email address and explicit consent. Until email is connected, that address stays on your device. You can remove it by clearing site data for this browser.
      </p>
      <p>
        When a real shop is connected, this policy should be replaced with the house’s notice on what is collected, why, how long it is kept, and how to reach the person responsible.
      </p>
    </InfoPage>
  );
}
