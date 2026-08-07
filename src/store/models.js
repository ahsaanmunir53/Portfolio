/**
 * Mongoose schemas.
 *
 * Built lazily so the app starts with no mongoose connection at all when
 * running on the JSON backend.
 *
 * Cover images are stored as data URLs on the document rather than as files.
 * Render's free tier has no persistent disk, so an uploaded file would be
 * gone by morning. The admin panel resizes and re-encodes every image to
 * WebP before upload, which keeps a cover well under 300KB - far inside
 * MongoDB's 16MB document limit.
 */

module.exports = function buildModels(mongoose) {
  const { Schema } = mongoose;

  const projectSchema = new Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 120 },
      tagline: { type: String, trim: true, maxlength: 160, default: "" },
      description: { type: String, trim: true, maxlength: 900, default: "" },
      url: { type: String, trim: true, default: "" },
      repo: { type: String, trim: true, default: "" },
      cover: { type: String, default: "" },       // data URL or remote URL
      initials: { type: String, trim: true, maxlength: 3, default: "" },
      hue: { type: Number, min: 0, max: 360, default: 210 },
      tags: { type: [String], default: [] },
      status: {
        type: String,
        enum: ["live", "wip", "archived"],
        default: "live",
      },
      featured: { type: Boolean, default: false },
      visible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  const experienceSchema = new Schema(
    {
      role: { type: String, required: true, trim: true, maxlength: 140 },
      org: { type: String, trim: true, maxlength: 160, default: "" },
      period: { type: String, trim: true, maxlength: 80, default: "" },
      current: { type: Boolean, default: false },
      points: { type: [String], default: [] },
      visible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  const skillSchema = new Schema(
    {
      group: { type: String, required: true, trim: true, maxlength: 80 },
      items: { type: [String], default: [] },
      visible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  const statSchema = new Schema(
    {
      value: { type: Number, default: 0 },
      suffix: { type: String, default: "" },
      label: { type: String, default: "" },
    },
    { _id: false }
  );

  const siteSchema = new Schema(
    {
      name: { type: String, default: "" },
      role: { type: String, default: "" },
      availability: { type: String, default: "" },
      heroLine: { type: String, default: "" },
      aboutTitle: { type: String, default: "" },
      about: { type: [String], default: [] },
      stats: { type: [statSchema], default: [] },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      cvFile: { type: String, default: "Ahsaan-Munir-CV.pdf" },
      contactTitle: { type: String, default: "" },
      contactLine: { type: String, default: "" },
      footer: { type: String, default: "" },
      marquee: { type: [String], default: [] },
    },
    { timestamps: true }
  );

  return {
    projects: mongoose.models.Project || mongoose.model("Project", projectSchema),
    experience:
      mongoose.models.Experience || mongoose.model("Experience", experienceSchema),
    skills: mongoose.models.Skill || mongoose.model("Skill", skillSchema),
    site: mongoose.models.Site || mongoose.model("Site", siteSchema),
  };
};
