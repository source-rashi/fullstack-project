import {  useState  } from "react";
import { toast } from "react-toastify";
import { api } from "../api/client";

const sanitizeDigits = (value, maxLength) => {
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const MessageForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleMessage = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(
        "/api/v1/message/send",
        { firstName, lastName, email, phone, message },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success(res.data.message);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container form-component message-form">
        <h2>Send Us A Message</h2>
        <form onSubmit={handleMessage}>
          <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="tel"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(sanitizeDigits(e.target.value, 10))}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key) || phone.length >= 10) e.preventDefault();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                const sanitized = sanitizeDigits(pasted, 10);
                setPhone(sanitized);
              }}
              onBlur={() => {
                if (phone.length !== 10) setPhoneError("Phone number must be exactly 10 digits.");
                else setPhoneError("");
              }}
            />
            {phoneError && <span className="error-message">{phoneError}</span>}
          </div>
          <textarea
            rows={7}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
        <img src="/Vector.png" alt="vector" />
      </div>
    </>
  );
};

export default MessageForm;
