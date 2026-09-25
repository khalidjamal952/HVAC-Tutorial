// =========================================
// CERTIFICATE AUTHENTICATION
// =========================================

const currentUser = JSON.parse(localStorage.getItem("hvacCurrentUser"));

const urlParams = new URLSearchParams(window.location.search);

const adminView = urlParams.get("admin") === "true";

const adminUserId = urlParams.get("userId");

if (!currentUser && !adminView) {
  window.location.href = "login.html";
}

// =========================================
// GET USER ORDERS
// =========================================

const orders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

let certificateUser = currentUser;

if (adminView && adminUserId) {
  const allUsers = JSON.parse(localStorage.getItem("hvacUsers")) || [];

  const selectedUser = allUsers.find(function (user) {
    return user.id === adminUserId;
  });

  if (selectedUser) {
    certificateUser = selectedUser;
  }
}

let myCourses = [];

orders.forEach(function (order) {
  if (
    order.customer &&
    certificateUser &&
    order.customer.email === certificateUser.email &&
    Array.isArray(order.courses)
  ) {
    myCourses = myCourses.concat(order.courses);
  }
});

// =========================================
// REMOVE DUPLICATE COURSES
// =========================================

const uniqueCourses = [];

myCourses.forEach(function (course) {
  const exists = uniqueCourses.some(function (item) {
    return item.id === course.id;
  });

  if (!exists) {
    uniqueCourses.push(course);
  }
});

// =========================================
// COURSE DETAILS
// =========================================

const courseDetails = {
  "hvac-fundamentals": {
    lessons: 25,
  },

  "air-conditioning": {
    lessons: 20,
  },

  refrigeration: {
    lessons: 30,
  },

  "hvac-electrical": {
    lessons: 22,
  },

  "installation-service": {
    lessons: 35,
  },

  troubleshooting: {
    lessons: 28,
  },
};

// =========================================
// PAGE DETECTION
// =========================================

const certificatesGrid = document.getElementById("certificatesGrid");

const certificatesEmpty = document.getElementById("certificatesEmpty");

const studentName = document.getElementById("studentName");

const courseName = document.getElementById("courseName");

const certificateId = document.getElementById("certificateId");

const completionDate = document.getElementById("completionDate");

const printCertificateBtn = document.getElementById("printCertificateBtn");

// =========================================
// CERTIFICATES LIST PAGE
// LOAD PROGRESS FROM MONGODB
// =========================================

if (certificatesGrid && certificatesEmpty) {
  function loadCompletedCourses() {
    function loadCompletedCourses() {
      certificatesGrid.innerHTML = "";

      // =========================================
      // COURSE NAMES
      // =========================================

      const courseNames = {
        "hvac-fundamentals": "HVAC Fundamentals",
        "air-conditioning": "Air Conditioning",
        refrigeration: "Refrigeration",
        "hvac-electrical": "HVAC Electrical",
        "installation-service": "Installation & Service",
        troubleshooting: "HVAC Troubleshooting",
      };

      // =========================================
      // FIND CURRENT USER ID
      // =========================================

      const userId = certificateUser?.id || null;

      // =========================================
      // FIND CERTIFICATES
      // =========================================

      let certificateKeys = [];

      if (userId) {
        const certificatePrefix = "hvacCertificate_" + userId + "_";

        certificateKeys = Object.keys(localStorage).filter(function (key) {
          return key.startsWith(certificatePrefix) && !key.endsWith("_date");
        });
      }

      // =========================================
      // LEGACY CERTIFICATE FALLBACK
      // =========================================

      if (certificateKeys.length === 0) {
        certificateKeys = Object.keys(localStorage).filter(function (key) {
          return (
            key.startsWith("hvacCertificate_") &&
            !key.endsWith("_date") &&
            !key.startsWith("hvacCertificate_undefined_")
          );
        });
      }

      console.log("Certificate Keys:", certificateKeys);

      // =========================================
      // NO CERTIFICATES
      // =========================================

      if (certificateKeys.length === 0) {
        certificatesGrid.style.display = "none";
        certificatesEmpty.style.display = "block";

        return;
      }

      // =========================================
      // SHOW CERTIFICATES
      // =========================================

      certificatesGrid.style.display = "grid";
      certificatesEmpty.style.display = "none";

      certificateKeys.forEach(function (key) {
        // =======================================
        // EXTRACT COURSE ID
        // =======================================

        const parts = key.split("_");
        const courseId = parts.slice(2).join("_");

        // =======================================
        // CERTIFICATE ID
        // =======================================

        const certId = localStorage.getItem(key);

        // =======================================
        // COMPLETION DATE
        // =======================================

        const dateKey = key + "_date";

        const storedDate = localStorage.getItem(dateKey);

        let formattedDate = "Completed";

        if (storedDate) {
          const date = new Date(storedDate);

          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
          }
        }

        // =======================================
        // COURSE NAME
        // =======================================

        const courseName =
          courseNames[courseId] ||
          courseId.replace(/-/g, " ").replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
          });

        // =======================================
        // CERTIFICATE CARD
        // =======================================

        const certificateCard = document.createElement("article");

        certificateCard.className = "certificate-card";

        certificateCard.innerHTML = `

      <div class="certificate-icon">
        🏆
      </div>

      <h2>
        ${courseName}
      </h2>

      <p>
        Congratulations! You have successfully
        completed this HVAC course.
      </p>

      <p class="certificate-date">
        <strong>Certificate ID:</strong>
        ${certId || "--"}
      </p>

      <p class="certificate-date">
        <strong>Completed:</strong>
        ${formattedDate}
      </p>

      <div class="certificate-actions">

        <a
          href="certificate.html?id=${encodeURIComponent(courseId)}"
          class="view-certificate-btn"
        >
          View Certificate
        </a>

      </div>

    `;

        certificatesGrid.appendChild(certificateCard);
      });
    }

    loadCompletedCourses();
  }

  loadCompletedCourses();
}

// =========================================
// LOAD CERTIFICATE FROM MONGODB
// =========================================

async function loadCertificateFromBackend(courseId) {
  const token = localStorage.getItem("hvacToken");

  if (!token) {
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/certificates/my", {
      method: "GET",

      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Certificate Fetch Error:", data);

      return;
    }

    const certificates = data.certificates || [];

    const certificate = certificates.find(function (item) {
      return item.courseId === courseId;
    });

    if (!certificate) {
      console.log("Certificate not found for this course.");

      return;
    }

    // Student Name
    if (certificate.user) {
      studentName.textContent = certificate.user.name || "--";
    } else {
      studentName.textContent = "--";
    }

    // Course Name
    courseName.textContent = certificate.courseName || "--";

    // Certificate ID
    certificateId.textContent = certificate.certificateId || "--";

    // Completion Date
    if (certificate.completionDate) {
      completionDate.textContent = new Date(
        certificate.completionDate,
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }

    console.log("Certificate loaded from MongoDB:", certificate);
  } catch (error) {
    console.error("Certificate Backend Error:", error);
  }
}

// =========================================
// INDIVIDUAL CERTIFICATE PAGE
// =========================================

if (studentName && courseName && certificateId && completionDate) {

  const urlParams =
    new URLSearchParams(window.location.search);

  const courseId =
    urlParams.get("id");

  const isAdmin =
    urlParams.get("admin") === "true";

  // =========================================
  // ADMIN CERTIFICATE VIEW
  // =========================================

  if (isAdmin) {

    const adminStudentName =
      urlParams.get("studentName");

    const adminCourseName =
      urlParams.get("courseName");

    const adminCertificateId =
      urlParams.get("certificateId");

    const adminIssueDate =
      urlParams.get("issueDate");

    // Student Name
    studentName.textContent =
      adminStudentName || "--";

    // Course Name
    courseName.textContent =
      adminCourseName || "--";

    // Certificate ID
    certificateId.textContent =
      adminCertificateId || "--";

    // Completion / Issue Date
    if (adminIssueDate) {

      completionDate.textContent =
        new Date(adminIssueDate).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric"
          }
        );

    } else {

      completionDate.textContent = "--";

    }

    console.log(
      "Admin Certificate Loaded:",
      {
        studentName: adminStudentName,
        courseName: adminCourseName,
        certificateId: adminCertificateId,
        issueDate: adminIssueDate
      }
    );

  }

  // =========================================
  // NORMAL STUDENT CERTIFICATE VIEW
  // =========================================

  else {

    if (!courseId) {

      alert("Certificate course not found.");

      window.location.href =
        "dashboard.html";

    } else {

      loadCertificateFromBackend(courseId);

    }

  }
}
// =========================================
// PRINT CERTIFICATE
// =========================================

if (printCertificateBtn) {
  printCertificateBtn.addEventListener("click", function () {
    window.print();
  });
}

// =========================================
// LOGOUT
// =========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem("hvacCurrentUser");

    window.location.href = "login.html";
  });
}

// =========================================
// CERTIFICATE VERIFICATION
// =========================================

const verificationForm = document.getElementById("verificationForm");

const verificationResult = document.getElementById("verificationResult");

const verificationTitle = document.getElementById("verificationTitle");

const verificationMessage = document.getElementById("verificationMessage");

const verifiedStudentName = document.getElementById("verifiedStudentName");

const verifiedCourseName = document.getElementById("verifiedCourseName");

const verifiedCertificateId = document.getElementById("verifiedCertificateId");

const verifiedCompletionDate = document.getElementById(
  "verifiedCompletionDate",
);

if (verificationForm) {
  verificationForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const enteredCertificateId = document
      .getElementById("certificateIdInput")
      .value.trim();

    if (!enteredCertificateId) {
      alert("Please enter a Certificate ID.");

      return;
    }

    // =========================================
    // VERIFY FROM MONGODB
    // =========================================

    try {
      const response = await fetch(
        "http://localhost:5000/api/certificates/verify/" +
          encodeURIComponent(enteredCertificateId),
      );

      const data = await response.json();

      console.log("Certificate Verification:", data);

      // =========================================
      // CERTIFICATE VALID
      // =========================================

      if (response.ok && data.valid === true && data.certificate) {
        const certificate = data.certificate;

        verificationResult.style.display = "block";

        verificationTitle.textContent = "Certificate Verified";

        verificationMessage.textContent =
          "This certificate is valid and was issued by HVAC Tutorial.";

        verifiedStudentName.textContent = certificate.user
          ? certificate.user.name
          : "--";

        verifiedCourseName.textContent = certificate.courseName || "--";

        verifiedCertificateId.textContent = certificate.certificateId || "--";

        if (certificate.completionDate) {
          verifiedCompletionDate.textContent = new Date(
            certificate.completionDate,
          ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        } else {
          verifiedCompletionDate.textContent = "--";
        }
      }

      // =========================================
      // CERTIFICATE NOT FOUND
      // =========================================
      else {
        verificationResult.style.display = "block";

        verificationTitle.textContent = "Certificate Not Found";

        verificationMessage.textContent =
          "No certificate was found with the entered Certificate ID.";

        verifiedStudentName.textContent = "--";

        verifiedCourseName.textContent = "--";

        verifiedCertificateId.textContent = "--";

        verifiedCompletionDate.textContent = "--";
      }
    } catch (error) {
      console.error("Certificate Verification Error:", error);

      verificationResult.style.display = "block";

      verificationTitle.textContent = "Verification Error";

      verificationMessage.textContent =
        "Unable to connect to the certificate verification server.";

      verifiedStudentName.textContent = "--";

      verifiedCourseName.textContent = "--";

      verifiedCertificateId.textContent = "--";

      verifiedCompletionDate.textContent = "--";
    }
  });
}
