        // Ensure the user is on the correct Node.js server port, not VS Code Live Server
        if (window.location.port === "5500" || window.location.port === "5501") {
            alert("Redirecting to the Express server... Please use http://localhost:3000 to make the database work.");
            window.location.href = "http://localhost:3000" + window.location.pathname;
        }

        const allCheck = document.getElementById('allCheck');
        if (allCheck) {
            const conditionChecks = [
                document.getElementById('ageCheck'),
                document.getElementById('weightCheck'),
                document.getElementById('healthCheck'),
                document.getElementById('tattooCheck')
            ];
            const submitBtn = document.querySelector('#registerForm button[type="submit"]');

            function checkConditions() {
                const allChecked = conditionChecks.every(c => c.checked);
                allCheck.checked = allChecked;
                if (submitBtn) {
                    submitBtn.disabled = !allChecked;
                }
            }

            // Tick/untick all boxes when "All of the above" is clicked
            allCheck.addEventListener('change', function() {
                conditionChecks.forEach(checkbox => checkbox.checked = this.checked);
                checkConditions();
            });

            // Automatically tick/untick "All of the above" if user clicks individual boxes
            conditionChecks.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    checkConditions();
                });
            });
            
            // Set the initial disabled state on load
            checkConditions();
        }


        const usernameInput = "admin";
        const passwordInput = "password123";
        
        function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username === usernameInput &&
                 password === passwordInput) {
                window.location.href ="/assets/donator.html";
            }else {
                alert("Invalid username or password. Please try again.");
            }
        } 

        function logout() {
            window.location.href ="/index.html";
        }

        // Fetch and display donors from the backend
        function loadDonors() {
            fetch('/api/donors?_t=' + Date.now())
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(donors => {
                    const donorsContainer = $("#doners .row");
                    donorsContainer.empty(); // Clear any existing content
                    
                    const activeDonors = donors.filter(d => !d.suspended);
                    activeDonors.forEach(donor => {
                        const cardHTML = `
                        <div class="col-md-4 d-flex align-items-stretch">
                            <div class="card mb-4 shadow-sm w-100 border-0 rounded-3">
                                <div class="card-body text-center d-flex flex-column justify-content-center">
                                    <h5 class="card-title fw-bold text-uppercase">${donor.name}</h5>
                                    <p class="text-muted mb-2">Age: ${donor.age} &bull; District: ${donor.district || 'N/A'}</p>
                                    <p class="card-text mt-3 mb-4">
                                        <span class="badge bg-danger p-3 fs-5 shadow-sm">Blood Group: ${donor.bloodGroup}</span>
                                    </p>
                                    <a href="tel:${donor.phone}" class="btn btn-outline-danger mt-auto rounded-pill">Contact</a>
                                </div>
                            </div>
                        </div>`;
                        donorsContainer.append(cardHTML);
                    });
                })
                .catch(error => console.error('Error fetching donors:', error));
        }

        // Fetch and display donors with admin controls
        function loadAdminDonors() {
            fetch('/api/donors?_t=' + Date.now())
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(donors => {
                    const donorsContainer = $("#admin-donors .row");
                    donorsContainer.empty(); 
                    
                    donors.forEach((donor, index) => {
                        const suspendBtnText = donor.suspended ? "Activate" : "Suspend (3 Months)";
                        const suspendBtnClass = donor.suspended ? "btn-outline-success" : "btn-outline-warning";
                        const opacityClass = donor.suspended ? "opacity-50" : "";
                        
                        let suspendInfo = "";
                        if (donor.suspended && donor.suspendUntil) {
                            const dateStr = new Date(donor.suspendUntil).toLocaleDateString();
                            suspendInfo = `<br><span class="text-danger fw-bold" style="font-size: 0.85em;">Suspended until: ${dateStr}</span>`;
                        }

                        const cardHTML = `
                        <div class="col-md-4 d-flex align-items-stretch">
                            <div class="card mb-4 shadow-sm w-100 border-0 rounded-3 ${opacityClass}">
                                <div class="card-body text-center d-flex flex-column justify-content-center">
                                    <h5 class="card-title fw-bold text-uppercase">${donor.name}</h5>
                                    <p class="text-muted mb-2">Age: ${donor.age} &bull; Phone: ${donor.phone}${suspendInfo}</p>
                                    <p class="card-text mt-3 mb-4">
                                        <span class="badge bg-danger p-3 fs-5 shadow-sm">Blood Group: ${donor.bloodGroup}</span>
                                    </p>
                                    <div class="d-flex justify-content-center flex-wrap gap-2 mt-auto">
                                        <a href="tel:${donor.phone}" class="btn btn-outline-info btn-sm rounded-pill">Call</a>
                                        <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="copyDonorData('${donor.id}')">Copy</button>
                                        <button class="btn ${suspendBtnClass} btn-sm rounded-pill" onclick="suspendDonor('${donor.id}')">${suspendBtnText}</button>
                                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="deleteDonor('${donor.id}')">Delete</button>
                                    </div>
                                    <textarea id="donor-data-${donor.id}" class="d-none">Name: ${donor.name}, Age: ${donor.age}, Phone: ${donor.phone}, Blood Group: ${donor.bloodGroup}, District: ${donor.district}</textarea>
                                </div>
                            </div>
                        </div>`;
                        donorsContainer.append(cardHTML);
                    });
                })
                .catch(error => console.error('Error fetching donors for admin:', error));
        }

        function copyDonorData(id) {
            const dataText = document.getElementById(`donor-data-${id}`).value;
            navigator.clipboard.writeText(dataText).then(() => {
                alert("Donor data copied to clipboard!");
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }

        function deleteDonor(id) {
            if (confirm("Are you sure you want to delete this donor?")) {
                fetch(`/api/donors/${id}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        loadAdminDonors();
                    })
                    .catch(error => console.error('Error deleting donor:', error));
            }
        }

        function suspendDonor(id) {
            fetch(`/api/donors/${id}/suspend`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadAdminDonors();
                })
                .catch(error => console.error('Error suspending donor:', error));
        }

        // Generate and download a PDF of the donors list
        function downloadPDF() {
            if (!window.jspdf) {
                alert("PDF library is still loading, please try again in a second.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            fetch('/api/donors?_t=' + Date.now())
                .then(response => response.json())
                .then(donors => {
                    const tableColumn = ["Name", "Age", "Blood Group", "Phone", "District", "Status"];
                    const tableRows = donors.map(donor => [
                        donor.name,
                        donor.age,
                        donor.bloodGroup,
                        donor.phone,
                        donor.district || 'N/A',
                        donor.suspended ? "Suspended" : "Active"
                    ]);

                    doc.setFontSize(18);
                    doc.text("Registered Donors List", 14, 20);

                    doc.autoTable({
                        head: [tableColumn],
                        body: tableRows,
                        startY: 25,
                        theme: 'grid',
                        headStyles: { fillColor: [220, 53, 69] } // Bootstrap Danger Red
                    });

                    doc.save("Donors_List.pdf");
                })
                .catch(error => console.error("Error generating PDF:", error));
        }

        $(document).ready(function() {
        if ($("#doners").length) loadDonors(); // Load standard donors if on home page
        if ($("#admin-donors").length) loadAdminDonors(); // Load admin donors if on donator page

        // Search filtering for donors
        $("#searchForm").on("submit", function(e) {
            e.preventDefault();
            const district = $("#district").val();
            const bloodGroup = $("#bloodGroup").val();

            fetch('/api/donors?_t=' + Date.now())
                .then(response => response.json())
                .then(donors => {
                    const donorsContainer = $("#doners .row");
                    donorsContainer.empty();
                    
                    let activeDonors = donors.filter(d => !d.suspended);
                    
                    if (district) {
                        activeDonors = activeDonors.filter(d => d.district && d.district.toLowerCase() === district.toLowerCase());
                    }
                    if (bloodGroup) {
                        activeDonors = activeDonors.filter(d => d.bloodGroup && d.bloodGroup.toLowerCase() === bloodGroup.toLowerCase());
                    }

                    if(activeDonors.length === 0) {
                        donorsContainer.append('<div class="col-12 text-center"><p class="text-muted fs-5 mt-4">No donors found matching your criteria.</p></div>');
                    } else {
                        activeDonors.forEach(donor => {
                            const cardHTML = `
                            <div class="col-md-4 d-flex align-items-stretch">
                                <div class="card mb-4 shadow-sm w-100 border-0 rounded-3">
                                    <div class="card-body text-center d-flex flex-column justify-content-center">
                                        <h5 class="card-title fw-bold text-uppercase">${donor.name}</h5>
                                        <p class="text-muted mb-2">Age: ${donor.age} &bull; District: ${donor.district || 'N/A'}</p>
                                        <p class="card-text mt-3 mb-4">
                                            <span class="badge bg-danger p-3 fs-5 shadow-sm">Blood Group: ${donor.bloodGroup}</span>
                                        </p>
                                        <a href="tel:${donor.phone}" class="btn btn-outline-danger mt-auto rounded-pill">Contact</a>
                                    </div>
                                </div>
                            </div>`;
                            donorsContainer.append(cardHTML);
                        });
                    }
                })
                .catch(error => console.error('Error searching donors:', error));
        });

        // Automatically submit the search form when a dropdown option is changed
        $("#state, #district, #bloodGroup").on("change", function() {
            $("#searchForm").trigger("submit");
        });

        $("#registerForm").validate({

                rules: {
                    d_name:{
                        required: true,
                        minlength: 3,
                        maxlength: 12,
                    },
                    d_age: {
                        required: true,
                        number: true,   
                        min: 18,
                        max: 60,    
                    },
                    bloodGroup: {
                        required: true,


                    },
                    d_phone: {
                        required: true,
                        number: true,   
                        maxlength: 10,
                        minlength: 10,
                        
                    }
                },
                messages: {
                    d_name: {
                        required: "Please enter your name",
                        minlength: "Please enter minimum 3 characters for your name"
                    },
                    d_age: "Please enter your age",
                    bloodGroup: "Please select your blood group",
                    d_phone: "Please enter your phone number"
                },
                submitHandler: function(form) {
                    
                    // Grab the values from the form inputs
                    const name = $("#name").val();
                    const age = $("#age").val();
                    const bg = $("#bg").val();
                    const district = $("#reg_district").val();
                    const phone = $("#phone").val();
                    
                    // Create an object with the data to send to the backend
                    const donorData = {
                        name: name,
                        age: age,
                        bloodGroup: bg,
                        district: district,
                        phone: phone
                    };

                    // Send the data to your backend API
                    fetch('/api/register-donor', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(donorData)
                    })
            .then(async response => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || 'Server returned status ' + response.status);
                }
                return data;
            })
                    .then(data => {
                        // Reload the full list directly from the database to ensure an accurate sync
                        if (typeof loadDonors === "function") {
                            loadDonors();
                        }
                        
                        // Clear the form and checkboxes after registering
                        form.reset();
                        $(".form-check-input").prop("checked", false);
                        $('#registerForm button[type="submit"]').prop('disabled', true);
                        
                        alert("Donor registered successfully and saved ");
                    })
                    .catch(error => {
                        console.error('Error saving donor:', error);
                alert("There was a problem saving the donor data: " + error.message);
                    });
                    
                    return false; // Safely prevent page reload
                }
            });
        });