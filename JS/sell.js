document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".car-form");
    const stateSelect = document.getElementById("state");
    const citySelect = document.getElementById("city");
    const makeSelect = document.getElementById("make");
    const modelSelect = document.getElementById("model");
    const fuelSelect = document.getElementById("fuel");
    const interestedBrand = document.getElementById("interestedBrand");
    const interestedModel = document.getElementById("interestedModel");
    const fileInput = document.getElementById("files");
    const uploadBox = document.getElementById("uploadBox");
    const cities = {
    punjab: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"],
    haryana: ["Gurgaon", "Faridabad", "Panipat", "Panchkula", "Ambala", "Karnal"],
    himachal_pradesh: ["Shimla", "Manali","Chamba","Dharamshala","Kangra","Kullu","Kufri","Dalhousie", "Solan", "Mandi","Una"],
    uttarakhand: ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Nainital"],
    uttar_pradesh: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Ghaziabad", "Meerut"],
    delhi: ["New Delhi", "Dwarka", "Rohini", "Saket", "Connaught Place","Bawana","Shahdara","Badarpur"],
    rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner"],
    j_and_k: ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    ladakh: ["Leh", "Kargil","Hanle","Nubra","Zanskar","Dras"],
    chandigarh: ["Chandigarh"]
    };
    const carModels = {
        RollsRoyce: ["Rolls Royce Phantom", "Rolls Royce Ghost", "Rolls Royce Cullinan"],
        LandRover: ["Range Rover Velar", "Range Rover Evoque", "Defender", "Discovery"],
        Mercedes: ["Mercedes Benz S-Class", "Mercedes Benz G-Class", "Mercedes Benz E-CLass", "Mercedes Benz GLS 600", "Mercedes Benz AMG"],
        Audi: ["Audi A4", "Audi A6", "Audi A8", "Audi Q5","Audi Q8", "Audi RS5", "Audi RS8"]
    };
    const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];
    fuelTypes.forEach(f => {
        const opt = new Option(f, f.toLowerCase());
        fuelSelect.add(opt);
    });
    Object.keys(carModels).forEach(make => {
        const capitalized = make.charAt(0).toUpperCase() + make.slice(1);
        const opt = new Option(capitalized, make);
        makeSelect.add(opt.cloneNode(true));
        interestedBrand.add(opt.cloneNode(true));
    });
    stateSelect.addEventListener("change", () => {
        const state = stateSelect.value;
        citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
        citySelect.disabled = !state;
        if (cities[state]) {
            cities[state].forEach(city => {
                citySelect.add(new Option(city, city.toLowerCase().replace(/\s+/g, '')));
            });
        }
    });

    makeSelect.addEventListener("change", () => {
        const make = makeSelect.value;
        modelSelect.innerHTML = '<option value="" disabled selected>Select Model</option>';
        modelSelect.disabled = !make;
        carModels[make]?.forEach(m => {
            modelSelect.add(new Option(m, m.toLowerCase().replace(/\s+/g, '')));
        });
    });

    interestedBrand.addEventListener("change", () => {
        const make = interestedBrand.value;
        interestedModel.innerHTML = '<option value="" disabled selected>Select Model</option>';
        interestedModel.disabled = !make;
        carModels[make]?.forEach(m => {
            interestedModel.add(new Option(m, m.toLowerCase().replace(/\s+/g, '')));
        });
    });

    ['dragenter', 'dragover'].forEach(e => {
        uploadBox.addEventListener(e, () => uploadBox.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(e => {
        uploadBox.addEventListener(e, () => uploadBox.classList.remove('dragover'), false);
    });
    uploadBox.addEventListener('drop', e => {
        e.preventDefault();
        fileInput.files = e.dataTransfer.files;
    });
    form.addEventListener("submit", e => {
        e.preventDefault();
        let valid = true;

        document.querySelectorAll(".error").forEach(el => el.remove());
        document.querySelectorAll("input, select, textarea").forEach(el => el.style.borderColor = "");
        uploadBox.style.border = "";

        const showError = (el, msg) => {
            const err = document.createElement("small");
            err.className = "error";
            err.style.color = "red";
            err.textContent = msg;
            el.parentElement.appendChild(err);
            el.style.borderColor = "red";
            valid = false;
        };

        const nameInput = document.getElementById("name");
        const nameValue = nameInput.value.trim();
        const nameRegex = /^[A-Za-z\s\.\-\']+$/;

        if (!nameValue) {
            showError(nameInput, "Name is required");
        } else if (!nameRegex.test(nameValue)) {
            showError(nameInput, "Name cannot contain numbers or special symbols");
        } else if (nameValue.length < 2) {
            showError(nameInput, "Name must be at least 2 characters");
        }
        const email = document.getElementById("email").value.trim();
        if (!email) {
            showError(document.getElementById("email"), "Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError(document.getElementById("email"), "Enter a valid email");
        }
        const phone = document.getElementById("phone").value;
        if (!phone) {
            showError(document.getElementById("phone"), "Phone number is required");
        } else if (!/^\d{10}$/.test(phone)) {
            showError(document.getElementById("phone"), "Enter a valid 10-digit phone number");
        }
        if (!stateSelect.value) showError(stateSelect, "Please select a state");
        if (!citySelect.value || citySelect.disabled) showError(citySelect, "Please select a city");
        if (!makeSelect.value) showError(makeSelect, "Please select a make");
        if (!modelSelect.value || modelSelect.disabled) showError(modelSelect, "Please select a model");
        if (!fuelSelect.value) showError(fuelSelect, "Please select fuel type");
        const year = document.getElementById("year").value;
        const currentYear = new Date().getFullYear();
        if (!year) {
            showError(document.getElementById("year"), "Year is required");
        } else if (year < 1900 || year > currentYear) {
            showError(document.getElementById("year"), `Year must be between 1900 and ${currentYear}`);
        }
        const km = document.getElementById("km").value;
        if (!km || km < 0) showError(document.getElementById("km"), "Enter valid kilometers");

        const insurance = document.getElementById("insurance").value;
        if (!insurance) {
            showError(document.getElementById("insurance"), "Insurance date is required");
        } else if (insurance < new Date().toISOString().split("T")[0]) {
            showError(document.getElementById("insurance"), "Insurance cannot be in the past");
        }

        const about = document.getElementById("about").value.trim();
        if (!about || about.length < 10) {
            showError(document.getElementById("about"), "Describe your car in at least 10 characters");
        }

        if (fileInput.files.length === 0) {
            // File upload is optional for now
            // uploadBox.style.border = "2px dashed red";
            // const err = document.createElement("small");
            // err.className = "error";
            // err.style.color = "red";
            // err.textContent = "Please upload at least one image";
            // uploadBox.appendChild(err);
            // valid = false;
        }
        if (!document.getElementById("consent").checked) {
            showError(document.getElementById("consent"), "You must agree to the consent");
        }
        if (valid) {
            // Check if user is logged in
            fetch('/api/users/me', { credentials: 'include' })
                .then(res => {
                    if (!res.ok) {
                        // Not logged in, show login popup
                        alert('Please log in to submit a sell request.')
                        document.getElementById('loginPopup')?.click()
                        throw new Error('Not logged in')
                    }
                    return res.json()
                })
                .then(() => {
                    const payload = {
                        name: nameValue,
                        email,
                        phone,
                        state: stateSelect.value,
                        city: citySelect.value,
                        make: makeSelect.value,
                        model: modelSelect.value,
                        fuel: fuelSelect.value,
                        year,
                        km,
                        insurance,
                        about,
                        filesCount: fileInput.files.length,
                        interestedBrand: interestedBrand.value || '',
                        interestedModel: interestedModel.value || '',
                        consent: document.getElementById("consent").checked
                    }

                    return fetch('/api/sell-requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        credentials: 'include'
                    })
                })
                .then(async (res) => {
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data.error || 'Failed to submit')
                    alert('Your sell request was submitted. Our team will contact you soon.')
                    // clear form
                    form.reset()
                })
                .catch(err => {
                    if (err.message !== 'Not logged in') {
                        console.error('Sell request error', err)
                        alert('Could not submit sell request. Please try again later.')
                    }
                })
        } else {
            alert("Please fix the errors before submitting.");
        }
    });
    form.querySelectorAll("input, select, textarea").forEach(input => {
        input.addEventListener("input", function () {
            if (this.style.borderColor === "red") {
                this.style.borderColor = "";
                const err = this.parentElement.querySelector(".error");
                if (err) err.remove();
            }
        });
    });
});