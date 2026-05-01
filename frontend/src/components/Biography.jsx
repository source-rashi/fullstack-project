
import PropTypes from "prop-types";

const Biography = ({ imageUrl }) => {
  return (
    <>
      <div className="container biography">
        <div className="banner">
          <img src={imageUrl} alt="whoweare" />
        </div>
        <div className="banner">
          <p>Biography</p>
          <h3>Who We Are</h3>
          <p>
            We are a patient-first medical institute focused on safe, timely,
            and compassionate care.
          </p>
          <p>
            Our teams bring together doctors, nurses, and support staff to
            deliver coordinated treatment across every department.
          </p>
          <p>
            We pair experienced clinicians with modern facilities to make every
            visit clear, comfortable, and efficient.
          </p>
          <p>We are all in 2026!</p>
          <p>We are working on a MERN STACK PROJECT.</p>
          <p>Coding is fun!</p>
        </div>
      </div>
    </>
  );
};

Biography.propTypes = {
  imageUrl: PropTypes.string.isRequired,
};

export default Biography;
