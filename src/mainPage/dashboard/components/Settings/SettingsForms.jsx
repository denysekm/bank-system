import React from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    InputAdornment,
    IconButton
} from "@mui/material";
import {
    Lock as LockIcon,
    Person as PersonIcon,
    Home as HomeIcon,
    Phone as PhoneIcon,
    Visibility,
    VisibilityOff,
    Key as KeyIcon
} from "@mui/icons-material";

/**
 * Moderní kontejner pro formuláře nastavení využívající MUI Paper.
 */
const SettingsCard = ({ title, hint, children }) => (
    <Paper
        elevation={0}
        sx={{
            p: { xs: 3, md: 5 },
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            color: "#1e293b",
            maxWidth: "600px",
            margin: "7rem auto 0 auto",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(108, 71, 255, 0.1)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
                content: '""',
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "radial-gradient(circle at 30% 30%, rgba(108, 71, 255, 0.03) 0%, transparent 50%)",
                pointerEvents: "none",
            },
        }}
    >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: hint ? 1 : 4, textAlign: "center", color: "#0f172a" }}>
            {title}
        </Typography>
        {hint && (
            <Box
                sx={{
                    mb: 4,
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "rgba(108, 71, 255, 0.05)",
                    border: "1px solid rgba(108, 71, 255, 0.1)",
                    textAlign: "center"
                }}
            >
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {hint}
                </Typography>
            </Box>
        )}
        {children}
    </Paper>
);

const StyledTextField = (props) => (
    <TextField
        fullWidth
        variant="outlined"
        sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
                color: "#1e293b",
                bgcolor: "#f8fafc",
                borderRadius: "14px",
                "& fieldset": { borderColor: "#e2e8f0" },
                "&:hover fieldset": { borderColor: "#cbd5e1" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1" },
            },
            "& .MuiInputLabel-root": { color: "#94a3b8" },
            "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
        }}
        {...props}
    />
);

const SubmitButton = ({ loading, children, ...props }) => (
    <Button
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
            mt: 1,
            py: 1.8,
            borderRadius: "16px",
            fontWeight: 700,
            fontSize: "1rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
            "&:hover": {
                background: "linear-gradient(135deg, #7477ff 0%, #5a52ff 100%)",
                boxShadow: "0 15px 30px rgba(79, 70, 229, 0.4)",
            },
        }}
        {...props}
    >
        {loading ? "Ukládám..." : children}
    </Button>
);

/**
 * Formulář pro změnu hesla.
 */
export const PasswordForm = ({ loading, onSubmit }) => {
    const [showOld, setShowOld] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);

    return (
        <SettingsCard title="Změna hesla">
            <Box component="form" onSubmit={onSubmit}>
                <StyledTextField
                    label="Staré heslo"
                    name="oldPassword"
                    type={showOld ? "text" : "password"}
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: "#6366f1" }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowOld(!showOld)} edge="end" sx={{ color: "#475569" }}>
                                        {showOld ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <StyledTextField
                    label="Nové heslo"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <KeyIcon sx={{ color: "#6366f1" }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNew(!showNew)} edge="end" sx={{ color: "#475569" }}>
                                        {showNew ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <StyledTextField
                    label="Potvrzení nového hesla"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <KeyIcon sx={{ color: "#6366f1" }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: "#475569" }}>
                                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <SubmitButton type="submit" loading={loading}>
                    Změnit heslo
                </SubmitButton>
            </Box>
        </SettingsCard>
    );
};

/**
 * Formulář pro změnu uživatelského jména (loginu).
 */
export const UsernameForm = ({ user, loading, onSubmit }) => (
    <SettingsCard
        title="Uživatelské jméno"
        hint="Uživatelské jméno lze změnit pouze jednou za 30 dní."
    >
        <Box component="form" onSubmit={onSubmit}>
            <StyledTextField
                label="Nové uživatelské jméno"
                name="newUsername"
                defaultValue={user?.login}
                required
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon sx={{ color: "#6366f1" }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <SubmitButton type="submit" loading={loading}>
                Změnit uživatelské jméno
            </SubmitButton>
        </Box>
    </SettingsCard>
);

/**
 * Formulář pro změnu adresy.
 */
export const AddressForm = ({ client, loading, onSubmit }) => (
    <SettingsCard title="Změna adresy">
        <Box component="form" onSubmit={onSubmit}>
            <StyledTextField
                label="Nová adresa"
                name="address"
                defaultValue={client?.address}
                required
                placeholder="Ulice, č.p., město, PSČ"
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <HomeIcon sx={{ color: "#6366f1" }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <SubmitButton type="submit" loading={loading}>
                Uložit adresu
            </SubmitButton>
        </Box>
    </SettingsCard>
);

/**
 * Formulář pro změnu telefonního čísla.
 */
export const PhoneForm = ({ client, loading, onSubmit }) => (
    <SettingsCard
        title="Telefonní číslo"
        hint="Číslo musí začínat +420 a mít přesně 9 číslic."
    >
        <Box component="form" onSubmit={onSubmit}>
            <StyledTextField
                label="Nové telefonní číslo"
                name="phone"
                defaultValue={client?.phone}
                placeholder="+420123456789"
                required
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <PhoneIcon sx={{ color: "#6366f1" }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />
            <SubmitButton type="submit" loading={loading}>
                Uložit telefon
            </SubmitButton>
        </Box>
    </SettingsCard>
);
