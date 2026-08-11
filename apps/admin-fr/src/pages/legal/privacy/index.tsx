import { type ReactNode } from "react";
import AuthCard from "@/containers/auth-card";

const listClassName = "list-disc list-inside pl-2 flex flex-col gap-1";
const pointers: { header: string; description: ReactNode }[] = [
  {
    header: "Information We Collect",
    description: (
      <>
        <p>
          To provide our services, we may collect the following information:
        </p>
        <ul className={`${listClassName}`}>
          <li>
            <strong>Account Information:</strong> Name, email address, and
            username provided during registration.
          </li>
          <li>
            <strong>Payment Data:</strong> We use third-party payment
            processors. We do not store your credit card or full financial
            details on our servers.
          </li>
          <li>
            <strong>Technical Logs:</strong> Temporary logs of your IP address
            may be recorded for security purposes (to prevent account
            sharing/abuse) and to optimize server routing.
          </li>
        </ul>
      </>
    ),
  },
  {
    header: "How We Use Your Information",
    description: (
      <>
        <p>We use the information we collect in the following ways:</p>
        <ul className={`${listClassName}`}>
          <li>To activate and manage your subscription.</li>
          <li>
            To send technical updates, service alerts, and support responses.
          </li>
          <li>
            To prevent fraudulent activity and ensure compliance with our Terms
            and Conditions.
          </li>
          <li>To improve our website performance and user experience.</li>
        </ul>
      </>
    ),
  },
  {
    header: "Cookies and Web Beacons",
    description: (
      <p>
        Like any other website, Beiz Panel uses 'cookies'. These cookies are
        used to store information including visitors' preferences, and the pages
        on the website that the visitor accessed or visited. The information is
        used to optimize the users' experience by customizing our web page
        content based on visitors' browser type and/or other information.
      </p>
    ),
  },
  {
    header: "Third-Party Privacy Policies",
    description: (
      <p>
        Beiz Panel's Privacy Policy does not apply to other advertisers or
        websites. We advise you to consult the respective Privacy Policies of
        these third-party servers (such as payment gateways or external player
        apps) for more detailed information.
      </p>
    ),
  },
  {
    header: "Data Security",
    description: (
      <p>
        We employ industry-standard encryption and security measures to protect
        your personal information from unauthorized access, alteration, or
        disclosure. However, no method of transmission over the internet is 100%
        secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    header: "Your Rights (GDPR/CCPA)",
    description: (
      <>
        <p>
          Depending on your location, you may have the following rights
          regarding your data:
        </p>
        <ul className={`${listClassName}`}>
          <li>The right to access the personal data we hold about you.</li>
          <li>The right to request the deletion of your personal data.</li>
          <li>The right to request a correction of inaccurate data.</li>
        </ul>
      </>
    ),
  },
  {
    header: "Changes to This Policy",
    description: (
      <p>
        We reserve the right to update this Privacy Policy at any time. We will
        notify users of any significant changes by posting the new policy on
        this page and updating the "Last Updated" date at the top.
      </p>
    ),
  },
  {
    header: "Contact Information",
    description: (
      <p>
        If you have additional questions or require more information about our
        Privacy Policy, do not hesitate to contact us at:{" "}
        <strong>support@tg-iptv.site</strong>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <AuthCard
      className="max-h-full overflow-y-auto"
      cardProps={{
        className: "max-w-[80%] min-md:max-h-[95dvh]",
      }}
      headerProps={{ className: "shrink-0" }}
      titleProps={{ children: "Privacy Policy" }}
      descriptionProps={{
        children: "Read below the complete privacy policy",
      }}
    >
      <div className="flex flex-col gap-2">
        <hr className="pb-2" />

        <p>
          At <strong>Beiz Panel</strong>, we prioritize the privacy of our
          visitors and subscribers. This Privacy Policy document outlines the
          types of information that is collected and recorded by our platform
          and how we use it.
        </p>

        <div className="italic rounded-lg py-1 px-2 border border-secondary bg-secondary">
          <strong>Our Commitment:</strong> We believe in minimal data
          collection. We do not monitor, log, or store records of the specific
          channels you watch or the content you stream.
        </div>

        <div className="py-2 flex flex-col gap-3">
          {pointers.map((dt, i) => (
            <div className="flex flex-col gap-1" key={`pointer-${i}`}>
              <h2 className="text-xl font-bold underline underline-offset-4">
                {i + 1}. {dt.header}
              </h2>
              {dt.description}
            </div>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
