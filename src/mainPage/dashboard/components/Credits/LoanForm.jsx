import React, { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import { useToast } from "../../../../context/ToastContext";
import {
    Box,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Grid,
    InputAdornment,
    CircularProgress,
    Card,
    CardContent
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
export default function LoanForm({ onSuccess, buildAuthHeader, hasActiveLoan }) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        amount: "",
        duration: "12",
        income: "",
        obligations: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasCreditCard, setHasCreditCard] = useState(true);
    const [checkingCard, setCheckingCard] = useState(true);

    useEffect(() => {
        const checkCards = async () => {
            try {
                const headers = buildAuthHeader();
                const res = await api.get("/cards/me", { headers });
                const creditCard = res.data.find(c =>
                    (c.cardType || "").toLowerCase().includes("kreditní") ||
                    (c.cardType || "").toLowerCase().includes("credit")
                );
                setHasCreditCard(!!creditCard);
            } catch (err) {
                console.error("Error checking cards:", err);
            } finally {
                setCheckingCard(false);
            }
        };
        checkCards();
    }, [buildAuthHeader]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const headers = buildAuthHeader();
            const res = await api.post("/loans/apply", {
                amount: Number(formData.amount),
                duration: Number(formData.duration),
                income: Number(formData.income),
                obligations: Number(formData.obligations || 0)
            }, { headers });

            if (res.data.ok) {
                addToast("success", "Půjčka byla schválena!");
                onSuccess();
            }
        } catch (err) {
            console.error("Apply error:", err);
            const msg = err.response?.data?.error || "Chyba při podávání žádosti.";
            setError(msg);
            addToast("error", msg);
        } finally {
            setLoading(false);
        }
    };

    if (hasActiveLoan) {
        return (
            <Card sx={{ borderRadius: "24px", bgcolor: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(10px)", color: "#1a1a1a", border: "1px solid rgba(0, 0, 0, 0.05)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)" }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <InfoOutlinedIcon sx={{ fontSize: 48, mb: 2, color: "#9770d2" }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#1a1a1a" }}>Máte aktivní půjčku</Typography>
                    <Typography variant="body1" sx={{ color: "#666" }}>
                        V tuto chvíli nelze zažádat o další půjčku, dokud nebude ta stávající řádně splacena.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (!checkingCard && !hasCreditCard) {
        return (
            <Card sx={{ borderRadius: "24px", bgcolor: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(10px)", color: "#1a1a1a", border: "1px solid #ed6c02", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)" }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <ErrorOutlineIcon sx={{ fontSize: 48, mb: 2, color: "#ed6c02" }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#1a1a1a" }}>Chybí kreditní karta</Typography>
                    <Typography variant="body1" sx={{ color: "#666" }}>
                        Pro podání žádosti o půjčku musíte mít nejdříve vytvořenou <strong>kreditní kartu</strong>, na kterou vám budou peníze vyplaceny.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box component="section" sx={{ p: { xs: 2, md: 4 }, bgcolor: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(10px)", borderRadius: "28px", border: "1px solid rgba(0, 0, 0, 0.05)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)" }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "#1a1a1a" }}>Žádost o půjčku</Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
                Vyplňte základní údaje pro vyhodnocení vaší žádosti.
            </Typography>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Požadovaná částka"
                            name="amount"
                            type="number"
                            variant="outlined"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="1000"
                            InputProps={{
                                endAdornment: <InputAdornment position="end" sx={{ color: "#666" }}>CZK</InputAdornment>,
                                sx: { 
                                    borderRadius: "16px",
                                    color: "#1a1a1a",
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.15)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.3)" },
                                }
                            }}
                            InputLabelProps={{ sx: { color: "#666" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel sx={{ color: "#666" }}>Doba splácení</InputLabel>
                            <Select
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                label="Doba splácení"
                                sx={{ 
                                    borderRadius: "16px", 
                                    color: "#1a1a1a",
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.15)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.3)" },
                                }}
                            >
                                <MenuItem value="6">6 měsíců</MenuItem>
                                <MenuItem value="12">12 měsíců</MenuItem>
                                <MenuItem value="24">24 měsíců</MenuItem>
                                <MenuItem value="36">36 měsíců</MenuItem>
                                <MenuItem value="48">48 měsíců</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Čistý měsíční příjem"
                            name="income"
                            type="number"
                            variant="outlined"
                            value={formData.income}
                            onChange={handleChange}
                            required
                            InputProps={{
                                endAdornment: <InputAdornment position="end" sx={{ color: "#666" }}>CZK</InputAdornment>,
                                sx: { 
                                    borderRadius: "16px",
                                    color: "#1a1a1a",
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.15)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.3)" },
                                }
                            }}
                            InputLabelProps={{ sx: { color: "#666" } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Stávající závazky"
                            name="obligations"
                            type="number"
                            variant="outlined"
                            value={formData.obligations}
                            onChange={handleChange}
                            placeholder="Volitelné"
                            InputProps={{
                                endAdornment: <InputAdornment position="end" sx={{ color: "#666" }}>CZK / měsíc</InputAdornment>,
                                sx: { 
                                    borderRadius: "16px",
                                    color: "#1a1a1a",
                                    bgcolor: "white",
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.15)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.3)" },
                                }
                            }}
                            InputLabelProps={{ sx: { color: "#666" } }}
                        />
                    </Grid>
                </Grid>

                {error && (
                    <Box sx={{ mt: 3, p: 2, borderRadius: "12px", bgcolor: "rgba(211, 47, 47, 0.1)", color: "#ff5252", display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutlineIcon fontSize="small" />
                        <Typography variant="body2">{error}</Typography>
                    </Box>
                )}

                <Box sx={{ mt: 5, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                        sx={{
                            borderRadius: "18px",
                            padding: "14px 40px",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            textTransform: "none",
                            background: "linear-gradient(135deg, #9770d2, #d17171)",
                            boxShadow: "0 8px 20px rgba(151, 112, 210, 0.4)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #8a64c4, #c46464)",
                                transform: "translateY(-2px)",
                                boxShadow: "0 10px 25px rgba(151, 112, 210, 0.6)",
                            },
                            "&.Mui-disabled": {
                                background: "rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.3)"
                            },
                            transition: "all 0.3s ease"
                        }}
                    >
                        {loading ? "Zpracovávám..." : "Odeslat žádost"}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
