(function () {
  "use strict";

  const TERMS_VERSION = "quickeats-rider-terms-2026-11-02";

  function getRider() {
    try { return typeof currentRider !== "undefined" ? currentRider : null; }
    catch (_) { return null; }
  }

  function injectFields() {
    const form = document.getElementById("riderApplicationForm");
    if (!form || document.getElementById("riderPreApprovalFields")) return;

    const panel = document.createElement("section");
    panel.id = "riderPreApprovalFields";
    panel.style.cssText = "border:1px solid #dcebe1;border-radius:14px;padding:14px;margin:0 0 16px;background:#f8fcf9";
    panel.innerHTML = [
      '<h3 style="margin:0 0 10px;color:#12382b">Personal and payout details</h3>',
      '<p style="margin:0 0 12px;color:#52645a;font-size:13px;line-height:1.5">These details are private and are visible to you and authorised platform administrators for rider verification and payouts.</p>',
      '<label for="riderOnboardingDob">Date of birth</label>',
      '<input id="riderOnboardingDob" type="date" required autocomplete="bday" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label for="riderOnboardingAddress">Full residential address</label>',
      '<textarea id="riderOnboardingAddress" required rows="2" maxlength="400" placeholder="House number, street, area and city" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box"></textarea>',
      '<label for="riderOnboardingEmergencyName">Emergency contact full name</label>',
      '<input id="riderOnboardingEmergencyName" type="text" required maxlength="100" placeholder="Emergency contact name" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label for="riderOnboardingEmergencyPhone">Emergency contact phone</label>',
      '<input id="riderOnboardingEmergencyPhone" type="tel" required maxlength="24" placeholder="Phone number" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label for="riderOnboardingPhoto">Passport-style profile photo</label>',
      '<input id="riderOnboardingPhoto" type="file" accept="image/jpeg,image/png,image/webp" style="display:block;width:100%;margin:6px 0 12px">',
      '<label for="riderOnboardingRegions">Delivery areas you can cover (optional)</label>',
      '<input id="riderOnboardingRegions" type="text" maxlength="240" placeholder="e.g. Yaba, Surulere, Ikeja" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<h3 style="margin:8px 0 10px;color:#12382b">Bank payout details</h3>',
      '<label for="riderOnboardingBank">Bank name</label>',
      '<input id="riderOnboardingBank" type="text" required maxlength="80" placeholder="Bank name" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label for="riderOnboardingAccountName">Account name</label>',
      '<input id="riderOnboardingAccountName" type="text" required maxlength="100" placeholder="Name on bank account" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label for="riderOnboardingAccountNumber">10-digit account number</label>',
      '<input id="riderOnboardingAccountNumber" type="text" inputmode="numeric" required maxlength="10" placeholder="0123456789" style="width:100%;padding:12px;border:1px solid #d9e2dc;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">',
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0 4px;font-size:13px;line-height:1.5">',
      '<input id="riderOnboardingTerms" type="checkbox" required style="margin-top:3px;flex:0 0 auto">',
      '<span>I have read and agree to the rider terms, safety requirements, identity checks and delivery rules. I confirm that the information and documents I provide are accurate.</span>',
      '</label>'
    ].join("");

    form.insertBefore(panel, form.firstChild);
  }

  async function prefillFields() {
    injectFields();
    const rider = getRider();
    if (!rider) return;
    const values = {
      riderOnboardingDob: rider.date_of_birth || "",
      riderOnboardingAddress: rider.residential_address || "",
      riderOnboardingEmergencyName: rider.emergency_contact_name || "",
      riderOnboardingEmergencyPhone: rider.emergency_contact_phone || "",
      riderOnboardingRegions: Array.isArray(rider.service_regions) ? rider.service_regions.join(", ") : ""
    };
    for (const [id, value] of Object.entries(values)) {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = value;
    }
    const photo = document.getElementById("riderOnboardingPhoto");
    if (photo) photo.required = !rider.profile_photo_path;
    const terms = document.getElementById("riderOnboardingTerms");
    if (terms) terms.checked = Boolean(rider.terms_accepted_at);

    if (typeof supabaseClient !== "undefined" && rider.id) {
      try {
        const { data, error } = await supabaseClient
          .from("rider_payout_details")
          .select("bank_name,account_name,account_number")
          .eq("rider_id", rider.id)
          .maybeSingle();
        if (!error && data) {
          const bank = document.getElementById("riderOnboardingBank");
          const name = document.getElementById("riderOnboardingAccountName");
          const number = document.getElementById("riderOnboardingAccountNumber");
          if (bank && !bank.value) bank.value = data.bank_name || "";
          if (name && !name.value) name.value = data.account_name || "";
          if (number && !number.value) number.value = data.account_number || "";
        }
      } catch (error) {
        console.warn("Could not prefill rider payout details:", error);
      }
    }
  }

  const originalShowOnboarding = window.showRiderOnboardingPage;
  if (typeof originalShowOnboarding === "function") {
    window.showRiderOnboardingPage = function () {
      originalShowOnboarding();
      prefillFields();
    };
  }

  const originalShowApprovalGate = window.showRiderApprovalGate;
  if (typeof originalShowApprovalGate === "function") {
    window.showRiderApprovalGate = function () {
      const rider = getRider();
      if (String(rider?.approval_status || "").toLowerCase() === "needs_resubmission") {
        window.showRiderOnboardingPage();
        return;
      }
      return originalShowApprovalGate();
    };
  }

  const originalSubmit = window.submitRiderApplication;
  if (typeof originalSubmit === "function") {
    window.submitRiderApplication = async function () {
      injectFields();
      const feedback = document.getElementById("riderApplicationFeedback");
      const button = document.getElementById("submitRiderApplicationBtn");
      if (button?.dataset.preparing === "true") return;
      if (button) {
        button.dataset.preparing = "true";
        button.disabled = true;
        button.textContent = "SAVING PROFILE DETAILS…";
      }
      const say = (message, isError = true) => {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.style.display = "block";
        feedback.style.visibility = "visible";
        feedback.style.color = isError ? "#b42318" : "#08783e";
        feedback.style.background = isError ? "#fff1f0" : "#effaf3";
        feedback.style.border = isError ? "1px solid #f3b7b2" : "1px solid #b8e4c7";
        feedback.style.borderRadius = "10px";
        feedback.style.padding = "10px 12px";
        feedback.style.marginTop = "10px";
      };

      try {
        const rider = getRider();
        if (typeof currentUser === "undefined" || !currentUser?.id || !rider?.id || typeof supabaseClient === "undefined") {
          throw new Error("Your rider session is missing. Sign out and sign in again.");
        }
        const dob = document.getElementById("riderOnboardingDob")?.value || "";
        const address = document.getElementById("riderOnboardingAddress")?.value.trim() || "";
        const emergencyName = document.getElementById("riderOnboardingEmergencyName")?.value.trim() || "";
        const emergencyPhone = document.getElementById("riderOnboardingEmergencyPhone")?.value.trim() || "";
        const bankName = document.getElementById("riderOnboardingBank")?.value.trim() || "";
        const accountName = document.getElementById("riderOnboardingAccountName")?.value.trim() || "";
        const accountNumber = (document.getElementById("riderOnboardingAccountNumber")?.value || "").replace(/\s/g, "");
        const termsAccepted = document.getElementById("riderOnboardingTerms")?.checked === true;
        const photoInput = document.getElementById("riderOnboardingPhoto");
        const photoFile = photoInput?.files?.[0] || null;
        const vehicleNumber = document.getElementById("riderVehicleNumber")?.value.trim() || "";
        const vehicleType = document.getElementById("riderVehicleType")?.value || "bicycle";
        const serviceRegions = [...new Set((document.getElementById("riderOnboardingRegions")?.value || "").split(",").map(x => x.trim()).filter(Boolean).map(x => x.slice(0, 60)))].slice(0, 12);

        if (!dob) throw new Error("Enter your date of birth.");
        const birth = new Date(dob + "T00:00:00");
        if (Number.isNaN(birth.getTime())) throw new Error("Enter a valid date of birth.");
        let age = new Date().getFullYear() - birth.getFullYear();
        const monthDiff = new Date().getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birth.getDate())) age--;
        if (age < 18) throw new Error("Riders must be at least 18 years old.");
        if (address.length < 8) throw new Error("Enter your full residential address.");
        if (emergencyName.length < 2 || emergencyPhone.replace(/\D/g, "").length < 7) throw new Error("Enter a valid emergency contact name and phone number.");
        if (vehicleNumber.length < 2) throw new Error("Enter your bicycle details or vehicle registration number.");
        if (bankName.length < 2 || accountName.length < 2 || !/^\d{10}$/.test(accountNumber)) throw new Error("Enter your bank name, account name and valid 10-digit account number.");
        if (!termsAccepted) throw new Error("You must accept the rider safety and delivery terms before submitting.");
        if (photoFile && (!["image/jpeg", "image/png", "image/webp"].includes(photoFile.type) || photoFile.size > 5 * 1024 * 1024)) {
          throw new Error("Profile photo must be JPG, PNG or WebP and 5 MB or smaller.");
        }

        let profilePhotoPath = rider.profile_photo_path || null;
        if (photoFile) {
          const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
          const unique = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
          profilePhotoPath = currentUser.id + "/profile_" + unique + "." + ext;
          const { error: uploadError } = await supabaseClient.storage
            .from("rider-documents")
            .upload(profilePhotoPath, photoFile, { upsert: false, contentType: photoFile.type });
          if (uploadError) throw new Error("Profile photo upload failed: " + uploadError.message);
        }
        if (!profilePhotoPath) throw new Error("Upload a clear profile photo before submitting.");

        const { data: updatedRider, error: riderError } = await supabaseClient
          .from("riders")
          .update({
            date_of_birth: dob,
            residential_address: address,
            emergency_contact_name: emergencyName,
            emergency_contact_phone: emergencyPhone,
            profile_photo_path: profilePhotoPath,
            vehicle_type: vehicleType,
            vehicle_number: vehicleNumber,
            service_regions: serviceRegions,
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION
          })
          .eq("id", rider.id)
          .eq("user_id", currentUser.id)
          .select("*")
          .single();
        if (riderError) throw new Error("Could not save your rider profile: " + riderError.message);

        const { error: payoutError } = await supabaseClient
          .from("rider_payout_details")
          .upsert({
            rider_id: rider.id,
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber,
            updated_at: new Date().toISOString()
          }, { onConflict: "rider_id" });
        if (payoutError) throw new Error("Could not save your bank payout details: " + payoutError.message);

        currentRider = { ...rider, ...updatedRider };
      } catch (error) {
        console.error("Rider pre-approval details failed:", error);
        say(error?.message || "Could not save your rider details.");
        return;
      } finally {
        if (button) {
          button.dataset.preparing = "false";
          button.disabled = false;
          button.textContent = "SUBMIT FOR REVIEW";
        }
      }

      return originalSubmit.apply(this, arguments);
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectFields();
    if (getRider()) prefillFields();
  });
})();
