export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-4 text-sm text-gray-400">
        Last updated: March 2026
      </p>

      <section className="space-y-4">
        <p>
          Clip Studio Pro is a web application that allows users to create and
          publish short video clips using content from their own accounts.
        </p>

        <h2 className="text-xl font-semibold mt-6">1. Use of the Service</h2>
        <p>
          You are responsible for the content you upload, generate, or publish.
          You confirm that you own the rights to the content or have permission to
          use it.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Third-Party Services</h2>
        <p>
          The application integrates with third-party services such as Google
          and TikTok. We are not responsible for changes or limitations imposed
          by these platforms.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. No Warranty</h2>
        <p>
          The service is provided “as is” without warranties of any kind.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Contact</h2>
        <p>
          For questions, contact us at:{" "}
          <strong>contact@clipstudiopro.app</strong>
        </p>
      </section>
    </main>
  );
}
