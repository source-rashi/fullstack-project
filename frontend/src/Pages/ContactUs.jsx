import MessageForm from "../components/MessageForm";

const ContactUs = () => {
  return (
    <>
      <div className="container">
        <h2>Contact Us</h2>
        <div style={{ marginBottom: "20px" }}>
          <p><strong>Institution :</strong> SRM University AP</p>
          <p><strong>Address     :</strong> Neerukonda, Mangalagiri Mandal,<br />Guntur District, Andhra Pradesh – 522240</p>
          <p><strong>Email       :</strong> srmap@edu.in</p>
          <p><strong>Phone       :</strong> +91 86390 01000</p>
        </div>
        <MessageForm />
      </div>
    </>
  );
};

export default ContactUs;