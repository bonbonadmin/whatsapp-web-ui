import { useAppTheme } from "common/theme";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const theme = useAppTheme();

  const getImageURL = () => {
    if (theme.mode === "light") return "/assets/images/entry-image-light.webp";
    return "/assets/images/entry-image-dark.png";
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const userLogin = process.env.REACT_APP_LOGIN_EMAIL;
  const encryptedPassword = process.env.REACT_APP_ENCRYPTED_PASSWORD || "";

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and Password are required");
      return;
    }

    setError("");

    const passwordMatch = bcrypt.compareSync(password, encryptedPassword);

    // Compare with the stored hash
    if (email === userLogin && passwordMatch) {
      console.log("✅ Password Match: Login Successful");

      localStorage.setItem("token", "mockToken123");
      localStorage.setItem("userEmail", email);

      navigate("/");
    } else {
      setError("❌ Incorrect password");
      console.log("❌ Password Mismatch: Login Failed");
    }
  };

  return (
    <div style={localStyles.container}>
      <div style={localStyles.loginWrapper}>
        {/* Left Section with Illustration */}
        <div style={localStyles.leftSection}>
          <div style={localStyles.imageWrapper}>
            <img src={getImageURL()} alt="WhatsApp Web" style={localStyles.image} />
          </div>
          <h2 style={localStyles.leftTitle}>WhatsApp Web</h2>
          <p style={localStyles.leftDescription}>
            Send and receive messages without keeping your phone online.
          </p>
        </div>

        {/* Right Section with Login Form */}
        <div style={localStyles.rightSection}>
          <h2 style={localStyles.title}>Hello Again!</h2>
          {/* <p>Aliquam consectetur et tincidunt praesent enim massa pellentesque velit odio neque</p> */}
          <div style={localStyles.form}>
            <input
              type="email"
              placeholder="Email"
              style={localStyles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              style={localStyles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={localStyles.error}>{error}</p>}
            <button
              onClick={handleLogin}
              style={{ ...localStyles.button }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#40af91")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#41CCA6")}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const localStyles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#111b21",
  },
  loginWrapper: {
    display: "flex",
    width: "900px",
    height: "500px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  leftSection: {
    background: "#252D31",
    color: "white",
    width: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    textAlign: "center",
  },
  imageWrapper: {
    width: "60%",
    marginBottom: "20px",
  },
  image: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
  },
  leftTitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  leftDescription: {
    fontSize: "14px",
    textAlign: "center",
    lineHeight: "1.5",
    maxWidth: "400px",
  },
  rightSection: {
    width: "50%",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#fff",
  },
  title: {
    fontSize: "28px",
    marginBottom: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
  },
  inputFocus: {
    outline: "none",
    borderColor: "#2d81f7",
  },
  checkboxWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  recoveryLink: {
    color: "#2d81f7",
    textDecoration: "none",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#41CCA6",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHover: {
    background: "#40af91",
  },
  error: {
    color: "red",
    fontSize: "12px",
    marginTop: "10px",
    textAlign: "center",
  },
};

export default LoginPage;
