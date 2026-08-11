import { type ReactNode } from "react";
import AuthCard from "@/containers/auth-card";

const listClassName = "list-disc list-inside pl-2 flex flex-col gap-1";
const pointers: { header: string; description: ReactNode }[] = [
  {
    header: "Acceptance of Terms",
    description: (
      <p>
        By purchasing a subscription or using our free trial, you confirm that
        you are at least 13 years of age and that you agree to these Terms and
        Conditions. If you do not agree, you must cease using the service
        immediately.
      </p>
    ),
  },
  {
    header: "Nature of Service",
    description: (
      <ul className={`${listClassName}`}>
        <li>
          <strong>No Content Ownership:</strong> Beiz Panel does not host,
          store, or manage the media files themselves. We provide a technical
          interface to access digital media content.
        </li>
        <li>
          <strong>Service Stability:</strong> While we strive for 99.9% uptime,
          we do not guarantee uninterrupted service. Buffering, downtime, or
          channel changes may occur due to server maintenance or external
          network issues.
        </li>
      </ul>
    ),
  },
  {
    header: "Usage Policy",
    description: (
      <>
        <p>
          To maintain the quality of service for all users, the following rules
          apply:
        </p>
        <ul className={`${listClassName}`}>
          <li>
            <strong>Single Connection:</strong> Unless you have purchased a
            multi-device plan, your account is limited to{" "}
            <strong>one (1) concurrent stream</strong>.
          </li>
          <li>
            <strong>No Re-streaming:</strong> You may not re-broadcast, sell, or
            distribute our stream to others.
          </li>
          <li>
            <strong>No VPN Abuse:</strong> While VPNs are allowed, using them to
            bypass regional restrictions or to mask fraudulent activity is
            prohibited.
          </li>
        </ul>
      </>
    ),
  },
  {
    header: "Subscription & Payments",
    description: (
      <ul className={`${listClassName}`}>
        <li>
          <strong>Activation:</strong> Accounts are typically activated within
          24 hours of payment confirmation.
        </li>
        <li>
          <strong>Pricing:</strong> We reserve the right to adjust pricing at
          any time. Active subscriptions will not be affected until the next
          renewal period.
        </li>
        <li>
          <strong>No Refunds:</strong> Due to the nature of digital content, all
          sales are final. We recommend using our free trial before committing
          to a long-term plan.
        </li>
      </ul>
    ),
  },
  {
    header: "Content & Copyright",
    description: (
      <p>
        Beiz Panel acts as a service provider. We do not have control over the
        content provided by third-party streams. Users are responsible for
        ensuring that their use of this service complies with local laws. We
        reserve the right to add or remove channels from any package at any time
        without prior notice.
      </p>
    ),
  },
  {
    header: "Disclaimer of Warranties",
    description: (
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST
        EXTENT PERMITTED BY LAW, Beiz Panel DISCLAIMS ALL WARRANTIES, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY OR FITNESS FOR A
        PARTICULAR PURPOSE.
      </p>
    ),
  },
  {
    header: "Limitation of Liability",
    description: (
      <p>
        Beiz Panel shall not be held liable for any direct, indirect, or
        incidental damages resulting from the use or inability to use our
        services, including but not limited to ISP throttling, hardware failure,
        or legal actions taken against the user in their local jurisdiction.
      </p>
    ),
  },
  {
    header: "Termination of Service",
    description: (
      <>
        <p>
          We reserve the right to terminate your access immediately, without
          refund, if we detect:
        </p>
        <ol className="list-decimal list-inside pl-2 flex flex-col gap-1">
          <li>Account sharing or multiple concurrent logins.</li>
          <li>Abuse of our support staff.</li>
          <li>Attempts to scrape or hack our servers.</li>
        </ol>
        <div className="py-1"></div>
        <hr />
      </>
    ),
  },
  {
    header: "Contact Information",
    description: (
      <p>
        If you have questions regarding these terms, please contact us at:{" "}
        <strong>support@tg-iptv.site</strong>.
      </p>
    ),
  },
];

export default function TermsAndConditions() {
  return (
    <AuthCard
      className="max-h-full overflow-y-auto"
      cardProps={{
        className: "max-w-[80%] min-md:max-h-[95dvh]",
      }}
      headerProps={{ className: "shrink-0" }}
      titleProps={{ children: "Terms and Condition" }}
      descriptionProps={{
        children: "Read below the complete terms and conditions listed",
      }}
    >
      <div className="flex flex-col gap-2">
        <hr className="pb-2" />
        {/* <p className="last-updated">Last Updated: 20 Dec 2024</p>
        <hr className="py-2" /> */}

        <p>
          Welcome to <strong>Beiz Panel</strong>. By accessing or using our
          service, you agree to be bound by the following terms. Please read
          them carefully.
        </p>

        <div className="italic rounded-lg py-1 px-2 border border-secondary bg-secondary">
          <strong>Disclaimer:</strong> These terms govern the use of our
          technical interface. Users are responsible for ensuring their use of
          the service complies with local regulations.
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
