import Profile from '../model/RegisterUsers.model.js';
// Create Profile
export const createProfile = async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res
      .status(201)
      .json({ message: "Profile created successfully", data: profile });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(400).json({ error: err.message });
  }
};

// Get All Profiles
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
};

// Get Single Profile by ID
export const getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.status(200).json(profile);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID or Profile not found" });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const updatedProfile = await Profile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProfile)
      return res.status(404).json({ error: "Profile not found" });
    res.status(200).json({ message: "Profile updated", data: updatedProfile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Profile
export const deleteProfile = async (req, res) => {
  try {
    const deleted = await Profile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
