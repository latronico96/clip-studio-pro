export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4 text-sm text-gray-400">
        Last updated: March 2026
      </p>

      <section className="space-y-4">
        <p>
          Clip Studio Pro respects your privacy. This policy explains how we
          collect and use your data.
        </p>

        <h2 className="text-xl font-semibold mt-6">
          1. Information We Collect
        </h2>
        <p>
          We collect basic user information such as name and email through
          Google authentication. If you connect a TikTok account, we store
          access tokens securely to publish content on your behalf.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Data Usage</h2>
        <p>
          Your data is used solely to provide and improve the service. We do not
          sell or share personal data.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Data Deletion</h2>
        <p>
          You can request deletion of your data by contacting us at:
          <strong> contact@clipstudiopro.app</strong>
        </p>
      </section>
    </main>
  );
}
