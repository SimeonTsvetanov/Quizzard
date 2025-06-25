import { Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import React from "react";

/**
 * PrivacyPolicyContent
 *
 * Reusable component for the full Privacy Policy content.
 * Used in both the Privacy Policy page and in info dialogs (e.g., entry modal legal info).
 */
export const PrivacyPolicyContent: React.FC = () => (
  <>
    <Typography variant="h4" component="h1" gutterBottom>
      Privacy Policy
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Last updated: June 2025</strong>
    </Typography>
    <Typography variant="body1" paragraph>
      This Privacy Policy explains how Quizzard collects, uses, and protects
      your information when you use our web application, including when you sign
      in with Google, create quizzes, upload files, or export to Google Drive or
      Google Slides.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      1. Information We Collect
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Account Information:</strong> If you choose Google login, we
      collect your name, email, and profile picture from your Google account. We
      do not access your password or other sensitive account data.
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Quiz Data:</strong> Quizzes you create, edit, or upload are stored
      in your browser (IndexedDB) and, if you choose, in your Google Drive. We
      do not access or share your quiz content except as required to provide the
      app's features.
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Files & Media:</strong> If you upload images, audio, or video,
      these files are stored locally and, if you choose, in your Google Drive.
      We do not access your other Google Drive files.
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Usage Data:</strong> We collect anonymous usage statistics (e.g.,
      feature usage, error logs) to improve the app. No personal data is
      included in analytics.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      2. How We Use Your Information
    </Typography>
    <Typography variant="body1" paragraph>
      - To provide and improve the Quizzard app and its features - To enable
      Google Drive and Google Slides integration (if you choose) - To save your
      quizzes and files for your use only - To comply with legal obligations
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      3. Google Drive & Slides Permissions
    </Typography>
    <Typography variant="body1" paragraph>
      If you sign in with Google, we request access to:
      <ul>
        <li>Your basic profile (name, email, picture)</li>
        <li>Your Google Drive (only files created by Quizzard)</li>
        <li>Your Google Slides (for exporting quizzes as presentations)</li>
      </ul>
      We never access, modify, or delete files in your Google Drive or Slides
      that were not created by Quizzard.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      4. Data Storage & Security
    </Typography>
    <Typography variant="body1" paragraph>
      - Your quizzes and files are stored in your browser (IndexedDB) and, if
      you choose, in your Google Drive. - We use secure authentication and
      encryption provided by Google APIs. - We do not store your data on our own
      servers.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      5. Data Retention & Deletion
    </Typography>
    <Typography variant="body1" paragraph>
      - You control your data. You can delete your quizzes and files at any time
      from within the app or your Google Drive. - If you log out, your Google
      authentication token is deleted from your browser. - We do not retain any
      personal data after you delete your account or files.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      6. User Rights (GDPR & Global)
    </Typography>
    <Typography variant="body1" paragraph>
      - You have the right to access, correct, or delete your data at any time.
      - You can withdraw Google permissions via your Google Account settings. -
      For any privacy questions, contact us at{" "}
      <a href="mailto:digital.thracians@gmail.com">
        digital.thracians@gmail.com
      </a>
      .
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      7. Children's Privacy
    </Typography>
    <Typography variant="body1" paragraph>
      Quizzard is not intended for children under 13. We do not knowingly
      collect personal information from children.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      8. Changes to This Policy
    </Typography>
    <Typography variant="body1" paragraph>
      We may update this Privacy Policy from time to time. Changes will be
      posted on this page with the updated date. Continued use of Quizzard after
      changes means you accept the new policy.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      9. Contact
    </Typography>
    <Typography variant="body1" paragraph>
      For questions or concerns about this Privacy Policy, contact:{" "}
      <a href="mailto:digital.thracians@gmail.com">
        digital.thracians@gmail.com
      </a>
    </Typography>
  </>
);

/**
 * Privacy Policy page - displays the Privacy Policy with a back button.
 * Uses PrivacyPolicyContent for the main content.
 */
export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 4 },
      }}
    >
      <IconButton aria-label="back" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>
      <PrivacyPolicyContent />
    </Box>
  );
}
