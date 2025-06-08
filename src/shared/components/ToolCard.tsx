import { Card, CardActionArea, Typography, Box } from "@mui/material";
import { type ReactNode } from "react";

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
        width: { xs: '85vw', sm: '320px', md: '280px', lg: '256px', xl: '304px' },
        maxWidth: 320,
        minHeight: { xs: 200, sm: 224, md: 240 },
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
          p: { xs: 1.6, sm: 2.4 },
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          height: '100%',
          gap: { xs: 0.8, sm: 1.2 },
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          '& .MuiTouchRipple-root': {
            color: disabled ? 'rgba(0, 0, 0, 0.2)' : 'primary.main',
          },
          '& .MuiTouchRipple-child': {
            backgroundColor: disabled ? 'rgba(0, 0, 0, 0.1)' : 'currentColor',
          },
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
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: { xs: 48, sm: 58, md: 64 },
          flexShrink: 0
        }}>
          {icon}
        </Box>
        <Typography 
          variant="h5" 
          component="div" 
          fontWeight={700}
          sx={{
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            lineHeight: 1.5,
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          {description}
        </Typography>
      </CardActionArea>
    </Card>
  );
} 