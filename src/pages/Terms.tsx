import { Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import React from "react";

/**
 * TermsContent
 *
 * Reusable component for the full Terms of Service content.
 * Used in both the Terms page and in info dialogs (e.g., entry modal legal info).
 */
export const TermsContent: React.FC = () => (
  <>
    <Typography variant="h4" component="h1" gutterBottom>
      Terms of Service
    </Typography>
    <Typography variant="body1" paragraph>
      <strong>Last updated: June 2025</strong>
    </Typography>
    <Typography variant="body1" paragraph>
      These Terms of Service ("Terms") govern your use of the Quizzard web
      application ("the Service"). By using Quizzard, you agree to these Terms.
      If you do not agree, do not use the Service.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      1. Use of Service
    </Typography>
    <Typography variant="body1" paragraph>
      - You must be at least 13 years old to use Quizzard. - You are responsible
      for your account and all activity under it. - You agree to use Quizzard
      only for lawful purposes and in accordance with these Terms.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      2. User Content
    </Typography>
    <Typography variant="body1" paragraph>
      - You retain ownership of quizzes, files, and content you create or
      upload. - By using Google Drive or Slides integration, you grant Quizzard
      permission to create, modify, and delete files in your Google Drive or
      Slides that are created by Quizzard only. - You are responsible for
      ensuring your content does not violate any laws or third-party rights.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      3. Google Integration
    </Typography>
    <Typography variant="body1" paragraph>
      - Quizzard uses Google APIs for authentication, Drive, and Slides
      integration. - You may revoke permissions at any time via your Google
      Account settings. - Quizzard will never access, modify, or delete files in
      your Google Drive or Slides that were not created by Quizzard.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      4. Data & Privacy
    </Typography>
    <Typography variant="body1" paragraph>
      - Your data is stored in your browser and, if you choose, in your Google
      Drive. - We do not store your data on our own servers. - See our Privacy
      Policy for details on data collection and use.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      5. Prohibited Conduct
    </Typography>
    <Typography variant="body1" paragraph>
      - Do not use Quizzard to upload or share illegal, harmful, or infringing
      content. - Do not attempt to access or interfere with other users' data. -
      Do not misuse Google APIs or attempt to circumvent security measures.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      6. Termination
    </Typography>
    <Typography variant="body1" paragraph>
      - You may stop using Quizzard at any time. - We reserve the right to
      suspend or terminate access if you violate these Terms or abuse the
      Service.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      7. Disclaimer & Limitation of Liability
    </Typography>
    <Typography variant="body1" paragraph>
      - Quizzard is provided "as is" without warranties of any kind. - We are
      not liable for any damages or data loss resulting from your use of the
      Service. - You use Quizzard at your own risk.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      8. Changes to Terms
    </Typography>
    <Typography variant="body1" paragraph>
      We may update these Terms from time to time. Changes will be posted on
      this page with the updated date. Continued use of Quizzard after changes
      means you accept the new Terms.
    </Typography>
    <Typography variant="h6" component="h2" gutterBottom>
      9. Contact
    </Typography>
    <Typography variant="body1" paragraph>
      For questions or concerns about these Terms, contact:{" "}
      <a href="mailto:digital.thracians@gmail.com">
        digital.thracians@gmail.com
      </a>
    </Typography>
  </>
);

/**
 * Terms page - displays the Terms of Service with a back button.
 * Uses TermsContent for the main content.
 */
export default function Terms() {
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
      <TermsContent />
    </Box>
  );
}
