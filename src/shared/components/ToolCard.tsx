import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface ToolCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ToolCard({ icon, title, description, onClick, disabled = false }: ToolCardProps) {
  return (
    <Card
      elevation={disabled ? 2 : 4}
      sx={{
        borderRadius: 3,
        width: { xs: '90vw', sm: '400px', md: '350px', lg: '320px', xl: '380px' },
        maxWidth: 400,
        minHeight: { xs: 250, sm: 280, md: 300 },
        transition: "transform 0.15s, box-shadow 0.15s",
        opacity: disabled ? 0.7 : 1,
        cursor: 'pointer',
        '&:hover': disabled ? {
          transform: 'translateY(-2px)',
        } : {
          boxShadow: 8,
          transform: 'translateY(-4px) scale(1.03)',
        },
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          height: '100%',
          justifyContent: 'space-between',
          cursor: 'pointer',
          // Remove mobile selection highlights
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          // Custom ripple styling for disabled cards
          '& .MuiTouchRipple-root': {
            color: disabled ? 'rgba(0, 0, 0, 0.2)' : 'primary.main',
          },
          '& .MuiTouchRipple-child': {
            backgroundColor: disabled ? 'rgba(0, 0, 0, 0.1)' : 'currentColor',
          },
          // Remove focus rings but keep accessibility
          '&:focus': { 
            outline: 'none',
            '& .MuiCardActionArea-focusHighlight': {
              opacity: 0,
            }
          },
          '&:focus-visible': { 
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
        TouchRippleProps={{
          style: {
            color: disabled ? 'rgba(0, 0, 0, 0.1)' : undefined,
          }
        }}
      >
        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: { xs: 60, sm: 72, md: 80 }
        }}>
          {icon}
        </Box>
        <CardContent sx={{ 
          textAlign: 'center', 
          p: 0, 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          <Typography 
            variant="h5" 
            component="div" 
            fontWeight={700} 
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.5
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
} 