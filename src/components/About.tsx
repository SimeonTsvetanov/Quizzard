import { Container, Paper, Typography, Box } from "@mui/material";

export default function About() {
  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            About Quizzard
          </Typography>
          <Typography variant="body1" gutterBottom>
            Quizzard is a modern, responsive, and accessible quiz and team tools suite built with React, TypeScript, and Material UI. Our mission is to provide a professional, device-consistent, and delightful experience for teams, educators, and event organizers.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This project is open for feedback and contributions. For more information, visit our GitHub or contact us via the links in the footer.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
