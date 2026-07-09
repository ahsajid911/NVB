import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  // Seeding creates the first super_admin, so we cannot require a session here
  // (chicken-and-egg). Instead, gate it behind EITHER an existing admin session
  // OR a one-time SETUP_TOKEN passed via the x-setup-token header / ?token= query.
  // This keeps the endpoint from being world-writable.
  const setupToken = process.env.SETUP_TOKEN;
  const providedHeader = request.headers.get("x-setup-token");
  const providedQuery = new URL(request.url).searchParams.get("token");
  const hasSetupToken = setupToken && (providedHeader === setupToken || providedQuery === setupToken);

  if (!hasSetupToken) {
    const sessionOk = request.cookies.get("admin_token")?.value;
    if (!sessionOk) {
      return NextResponse.json(
        { error: "Unauthorized. Provide x-setup-token header (matching SETUP_TOKEN env) or an admin session." },
        { status: 401 }
      );
    }
  }

  const sb = supabaseAdmin;
  const results: string[] = [];

  try {
    const passwordHash = await bcrypt.hash("HealthNav2025!", 10);
    const { error: adminErr } = await sb.from("admins").upsert({
      id: "00000000-0000-0000-0000-000000000001",
      username: "admin",
      email: "admin@healthnav.bd",
      password_hash: passwordHash,
      role: "super_admin",
      is_active: true,
    }, { onConflict: "username" });
    results.push(adminErr ? `Admin: ${adminErr.message}` : "Admin: OK");

    const { error: profErr } = await sb.from("admin_profiles").upsert({
      admin_id: "00000000-0000-0000-0000-000000000001",
      full_name: "Super Admin",
      bio: "System administrator",
    }, { onConflict: "admin_id" });
    results.push(profErr ? `Profile: ${profErr.message}` : "Profile: OK");

    const districts = [
      { id: "1", name: "Dhaka", name_bn: "ঢাকা", division: "Dhaka", division_bn: "ঢাকা" },
      { id: "2", name: "Chittagong", name_bn: "চট্টগ্রাম", division: "Chittagong", division_bn: "চট্টগ্রাম" },
      { id: "3", name: "Sylhet", name_bn: "সিলহেট", division: "Sylhet", division_bn: "সিলহেট" },
      { id: "4", name: "Rajshahi", name_bn: "রাজশাহী", division: "Rajshahi", division_bn: "রাজশাহী" },
      { id: "5", name: "Khulna", name_bn: "খুলনা", division: "Khulna", division_bn: "খুলনা" },
      { id: "6", name: "Barisal", name_bn: "বরিশাল", division: "Barisal", division_bn: "বরিশাল" },
      { id: "7", name: "Rangpur", name_bn: "রাঙ্গপুর", division: "Rangpur", division_bn: "রাঙ্গপুর" },
      { id: "8", name: "Mymensingh", name_bn: "ময়মনসিংহ", division: "Mymensingh", division_bn: "ময়মনসিংহ" },
      { id: "9", name: "Comilla", name_bn: "কুমিল্লা", division: "Chittagong", division_bn: "চট্টগ্রাম" },
      { id: "10", name: "Gazipur", name_bn: "গাজীপুর", division: "Dhaka", division_bn: "ঢাকা" },
    ];
    const { error: distErr } = await sb.from("districts").upsert(districts, { onConflict: "id" });
    results.push(distErr ? `Districts: ${distErr.message}` : `Districts: ${districts.length} seeded`);

    const specialties = [
      { id: "1", name: "Cardiologist", name_bn: "হৃদরোগবিশেষজ্ঞ", slug: "cardiologist", description: "Heart and cardiovascular system", description_bn: "হৃদয় এবং হৃদসংস্থান তন্ত্র", icon: "heart-pulse" },
      { id: "2", name: "Neurologist", name_bn: "স্নায়ুরোগবিশেষজ্ঞ", slug: "neurologist", description: "Brain and nervous system", description_bn: "মস্তিষ্ক এবং স্নায়ু তন্ত্র", icon: "brain" },
      { id: "3", name: "Dermatologist", name_bn: "চর্মরোগবিশেষজ্ঞ", slug: "dermatologist", description: "Skin, hair, and nails", description_bn: "চর্ম, চুল, নখ", icon: "droplets" },
      { id: "4", name: "Orthopedic Surgeon", name_bn: "কেঠিদশস্ত্র", slug: "orthopedic-surgeon", description: "Bones, joints, muscles", description_bn: "হাড়, জন্ট, পেশি", icon: "bone" },
      { id: "5", name: "Gastroenterologist", name_bn: "স্তকনচিলিতশাস্ত", slug: "gastroenterologist", description: "Digestive system", description_bn: "পাচন তন্ত্র", icon: "activity" },
      { id: "6", name: "Psychiatrist", name_bn: "মানসিক ডাক্তার", slug: "psychiatrist", description: "Mental health", description_bn: "মানসিক স্নেহ সংরত্তা", icon: "brain" },
      { id: "7", name: "ENT Specialist", name_bn: "কান, নাক, চলন বিশেষজ্ঞ", slug: "ent-specialist", description: "Ear, nose, throat", description_bn: "কান, নাক, চলন", icon: "stethoscope" },
      { id: "8", name: "Gynecologist", name_bn: "স্ত্রী স্নেহ ডাক্তার", slug: "gynecologist", description: "Female reproductive health", description_bn: "নারীসন্তান্তর স্নেহ সংরত্তা", icon: "baby" },
      { id: "9", name: "Pediatrician", name_bn: "শিশু স্নেহ ডাক্তার", slug: "pediatrician", description: "Children health", description_bn: "শিশুর স্নেহ সংরত্তা", icon: "baby" },
      { id: "10", name: "Oncologist", name_bn: "ক্রন রোগ ডাক্তার", slug: "oncologist", description: "Cancer treatment", description_bn: "থাসর চিকিতসা", icon: "activity" },
      { id: "11", name: "Pulmonologist", name_bn: "ফুসফুলক ডাক্তার", slug: "pulmonologist", description: "Lungs and respiratory", description_bn: "ফুসফুল এত শ্বসন তন্ত্র", icon: "wind" },
      { id: "12", name: "Urologist", name_bn: "মূত্রতন্ত্র ডাক্তার", slug: "urologist", description: "Urinary tract", description_bn: "মূত্রতন্ত্র তন্ত্র", icon: "droplets" },
      { id: "13", name: "Ophthalmologist", name_bn: "চশু ডাক্তার", slug: "ophthalmologist", description: "Eye care", description_bn: "চশু সেরা", icon: "eye" },
      { id: "14", name: "Endocrinologist", name_bn: "হরমেতস ডাক্তার", slug: "endocrinologist", description: "Hormones and metabolism", description_bn: "হরমেতস তত সস্থহেু তন্ত্র", icon: "activity" },
      { id: "15", name: "General Surgeon", name_bn: "সাধারণ শল্যের", slug: "general-surgeon", description: "Surgical procedures", description_bn: "শল্য প্রক্রিয়া", icon: "scissors" },
    ];
    const { error: specErr } = await sb.from("specialties").upsert(specialties, { onConflict: "id" });
    results.push(specErr ? `Specialties: ${specErr.message}` : `Specialties: ${specialties.length} seeded`);

    const hospitals = [
      { id: "1", name: "Square Hospital", name_bn: "স্কয়ার হাসপাতাল", district_id: "1", type: "private", address: "18/F, Bir Uttam Qazi Nuruzzaman Road, West Panthapath, Dhaka 1205", address_bn: "একশেন্দ্র/এফ, বীর উত্তম কাজি নুরুজ্জামান রোড, পশ্চিম পন্থপাত, ঢাকা 1205", contact_phone: "+880-2-8144400", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "ক্রনরোগদশ্ত্র", "শিশুসনেহ", "স্তকনচিলিশনেহ", "কান-নাক-চলন", "চর্মরোগ"] },
      { id: "2", name: "United Hospital", name_bn: "ইথ্যুনাইতেদ হাসপাতাল", district_id: "1", type: "private", address: "Plot 81, Road 17/A, Banani, Dhaka 1213", address_bn: "প্লট 81, রোড 17/য, বনানী, ঢাকা 1213", contact_phone: "+880-2-87141101", departments: ["Cardiology", "Neurology", "Orthopedics", "Ophthalmology", "Urology", "Gastroenterology", "ENT"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "চশুসনেহ", "মূত্রতন্ত্রসনেহ", "স্তকনচিলিশনেহ", "কান-নাক-চলন"] },
      { id: "3", name: "Evercare Hospital Dhaka", name_bn: "এভর্ডস হাসপাতাল ঢাকা", district_id: "1", type: "private", address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229", address_bn: "প্লট 81, ব্লক ই, বশুন্ধরা রিসর্স, ঢাকা 1229", contact_phone: "+880-2-55020001", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "ক্রনরোগদশ্ত্র", "শিশুসনেহ", "স্তকনচিলিশনেহ", "কান-নাক-চলন", "চর্মরোগ", "মানসিক সনেহ", "ফুসফুলকসনেহ"] },
      { id: "4", name: "BIRDEM General Hospital", name_bn: "বিরডেম সাধারণ হাসপাতাল", district_id: "1", type: "private", address: "Shahbagh, Dhaka 1000", address_bn: "শাহবাগ, ঢাকা 1000", contact_phone: "+880-2-96610511", departments: ["Cardiology", "Endocrinology", "Gastroenterology", "Nephrology", "Neurology", "Ophthalmology"], departments_bn: ["হৃদরোগসনীত", "হরমেতসনেহ", "স্তকনচিলিশনেহ", "বৃক্শলনেহ", "স্নায়ুরোগজি", "চশুসনেহ"] },
      { id: "5", name: "Labaid Hospital Dhanmondi", name_bn: "লারিদেদ হাসপাতাল ধানমন্ডি", district_id: "1", type: "private", address: "Road 4, Dhanmondi, Dhaka 1205", address_bn: "রোড 4, ধানমন্ডি, ঢাকা 1205", contact_phone: "+880-2-96611133", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "ক্রনরোগদশ্ত্র", "স্তকনচিলিশনেহ", "কান-নাক-চলন", "চর্মরোগ", "মানসিক সনেহ", "ফুসফুলকসনেহ"] },
      { id: "6", name: "Apollo Hospitals Dhaka", name_bn: "দেন্তাপুলস হাসপাতাল ঢাকা", district_id: "1", type: "private", address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229", address_bn: "প্লট 81, ব্লক ই, বশুন্ধরা রিসর্স, ঢাকা 1229", contact_phone: "+880-2-55020001", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Dermatology", "Psychiatry", "Pulmonology", "Urology", "Ophthalmology"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "ক্রনরোগদশ্ত্র", "শিশুসনেহ", "স্তকনচিলিশনেহ", "কান-নাক-চলন", "চর্মরোগ", "মানসিক সনেহ", "ফুসফুলকসনেহ", "মূত্রতন্ত্রসনেহ", "চশুসনেহ"] },
      { id: "7", name: "Chittagong Medical College Hospital", name_bn: "চট্টগ্রাম মেডিকেল কলেজন হাসপাতাল", district_id: "2", type: "government", address: "Chittagong Medical College Road, Chittagong 4203", address_bn: "চট্টগ্রাম মেডিকেল রোড, চট্টগ্রাম 4203", contact_phone: "+880-31-611584", departments: ["Cardiology", "Neurology", "Orthopedics", "General Surgery", "Pediatrics", "ENT"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "সাধারণ শল্য", "শিশুসনেহ", "কান-নাক-চলন"] },
      { id: "8", name: "Bangabandhu Sheikh Mujib Medical University", name_bn: "বঙ্গবন্ধু শেখ মুজিব মেডিকেল তত্তবেদ ততসন্স্থান", district_id: "1", type: "government", address: "Shahbagh, Dhaka 1000", address_bn: "শাহবাগ, ঢাকা 1000", contact_phone: "+880-2-55165081", departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics", "Gastroenterology", "ENT", "Psychiatry", "General Surgery", "Pulmonology"], departments_bn: ["হৃদরোগসনীত", "স্নায়ুরোগজি", "কেঠিদশস্ত্র", "ক্রনরোগদশ্ত্র", "শিশুসনেহ", "স্তকনচিলিশনেহ", "কান-নাক-চলন", "মানসিক সনেহ", "সাধারণ শল্য", "ফুসফুলকসনেহ"] },
    ];
    const { error: hospErr } = await sb.from("hospitals").upsert(hospitals, { onConflict: "id" });
    results.push(hospErr ? `Hospitals: ${hospErr.message}` : `Hospitals: ${hospitals.length} seeded`);

    const doctors = [
      { id: "1", name: "Dr. Aminul Haque", name_bn: "ডঃ আমিনুল হাক", qualifications: "MBBS, MD Cardiology", qualifications_bn: "এমবিবিস, এমডি কার্দিওলজি", experience_years: 15, consultation_fee: 2000, gender: "male", contact_phone: "+880-1711-001", chamber_address: "Square Hospital, Room 512, Dhaka", chamber_address_bn: "স্কয়ার হাসপাতাল, রুম 512, ঢাকা", bio: "Senior cardiologist with 15 years experience", bio_bn: "তেরেশ নরসন্তহসসিস সহ দীর্ঘ বছর রদজপ্রাপ্ত কেদস্ত্রেস্ত" },
      { id: "2", name: "Dr. Fatema Begum", name_bn: "ডঃ ফাতেমা বেগুম", qualifications: "MBBS, FCPS Cardiology", qualifications_bn: "এমবিবিস, এসিপিস কার্দিওলজি", experience_years: 12, consultation_fee: 1800, gender: "female", contact_phone: "+880-1711-002", chamber_address: "United Hospital, Dhaka", chamber_address_bn: "ইথ্যুনাইতেদ হাসপাতাল, ঢাকা", bio: "Interventional cardiologist", bio_bn: "ইন্ট্রভেশনল কেদস্ত্রেস্ত" },
      { id: "3", name: "Dr. Rafiqul Islam", name_bn: "ডঃ রহিকুল ইসলাম", qualifications: "MBBS, MD Neurology", qualifications_bn: "এমবিবিস, এমডি নিউরোলজি", experience_years: 18, consultation_fee: 2500, gender: "male", contact_phone: "+880-1711-003", chamber_address: "Square Hospital, Dhaka", chamber_address_bn: "স্কয়ার হাসপাতাল, ঢাকা", bio: "Expert neurologist", bio_bn: "দক্ষ নিউরোলজিস্ত" },
      { id: "4", name: "Dr. Nasreen Akhter", name_bn: "ডঃ নশরীন অখ্তার", qualifications: "MBBS, FCPS Neurology", qualifications_bn: "এমবিবিস, এসিপিস নিউরোলজি", experience_years: 10, consultation_fee: 1500, gender: "female", contact_phone: "+880-1711-004", chamber_address: "United Hospital, Dhaka", chamber_address_bn: "ইথ্যুনাইতেদ হাসপাতাল, ঢাকা", bio: "Neurologist specializing in epilepsy", bio_bn: "মির্গ বিশেষজ্ঞ নিউরোলজিস্ত" },
      { id: "5", name: "Dr. Kamal Hossain", name_bn: "ডঃ কামল হুসসেন", qualifications: "MBBS, DDV Dermatology", qualifications_bn: "এমবিবিস, ডিডিভি চর্মততততব", experience_years: 8, consultation_fee: 1000, gender: "male", contact_phone: "+880-1711-005", chamber_address: "Labaid Hospital, Dhaka", chamber_address_bn: "লারিদেদ হাসপাতাল, ঢাকা", bio: "Dermatologist and skin specialist", bio_bn: "চর্মরোগ তত চর্ম বিশেষজ্ঞ" },
      { id: "6", name: "Dr. Md. Shahidullah", name_bn: "ডঃ মহমুদ শহিদুল্লাহ", qualifications: "MBBS, MS Orthopedics", qualifications_bn: "এমবিবিস, এমস কেঠিদশস্ত্র", experience_years: 14, consultation_fee: 1500, gender: "male", contact_phone: "+880-1711-006", chamber_address: "Square Hospital, Dhaka", chamber_address_bn: "স্কয়ার হাসপাতাল, ঢাকা", bio: "Orthopedic surgeon", bio_bn: "কেঠিদশস্ত্র শল্য" },
      { id: "7", name: "Dr. Anisur Rahman", name_bn: "ডঃ আনিসুর রহমান", qualifications: "MBBS, MD Gastroenterology", qualifications_bn: "এমবিবিস, এমডি স্তকনচিলেহ", experience_years: 11, consultation_fee: 1600, gender: "male", contact_phone: "+880-1711-007", chamber_address: "Square Hospital, Dhaka", chamber_address_bn: "স্কয়ার হাসপাতাল, ঢাকা", bio: "Gastroenterologist", bio_bn: "স্তকনচিলেহসস্ত" },
      { id: "8", name: "Dr. Farhana Islam", name_bn: "ডঃ ফরহানা ইসলাম", qualifications: "MBBS, FCPS Psychiatry", qualifications_bn: "এমবিবিস, এসিপিস মানসিক সেবা", experience_years: 9, consultation_fee: 1400, gender: "female", contact_phone: "+880-1711-008", chamber_address: "National Institute of Mental Health", chamber_address_bn: "জাতীয় মানসিক সেবা প্রতিষ্ঠান", bio: "Psychiatrist", bio_bn: "মানসিক ডাক্তার" },
      { id: "9", name: "Dr. Muhammad Karim", name_bn: "ডঃ মুহম্মদ করিম", qualifications: "MBBS, FCPS ENT", qualifications_bn: "এমবিবিস, এসিপিস ইন্টি", experience_years: 13, consultation_fee: 1200, gender: "male", contact_phone: "+880-1711-009", chamber_address: "United Hospital, Dhaka", chamber_address_bn: "ইথ্যুনাইতেদ হাসপাতাল, ঢাকা", bio: "ENT specialist", bio_bn: "কান-নাক-চলন বিশেষজ্ঞ" },
      { id: "10", name: "Dr. Shirin Sultana", name_bn: "ডঃ শিরিন সুলতানা", qualifications: "MBBS, FCPS Gynecology", qualifications_bn: "এমবিবিস, এসিপিস স্তীসনেহ", experience_years: 16, consultation_fee: 1500, gender: "female", contact_phone: "+880-1711-010", chamber_address: "Square Hospital, Dhaka", chamber_address_bn: "স্কয়ার হাসপাতাল, ঢাকা", bio: "Gynecologist and obstetrician", bio_bn: "স্তীসনেহজন তত প্রসতীবিকদশেত্রী" },
    ];
    const { error: docErr } = await sb.from("doctors").upsert(doctors, { onConflict: "id" });
    results.push(docErr ? `Doctors: ${docErr.message}` : `Doctors: ${doctors.length} seeded`);

    const doctorSpecialties = [
      { doctor_id: "1", specialty_id: "1" }, { doctor_id: "2", specialty_id: "1" },
      { doctor_id: "3", specialty_id: "2" }, { doctor_id: "4", specialty_id: "2" },
      { doctor_id: "5", specialty_id: "3" }, { doctor_id: "6", specialty_id: "4" },
      { doctor_id: "7", specialty_id: "5" }, { doctor_id: "8", specialty_id: "6" },
      { doctor_id: "9", specialty_id: "7" }, { doctor_id: "10", specialty_id: "8" },
    ];
    const { error: dsErr } = await sb.from("doctor_specialties").upsert(doctorSpecialties, { onConflict: "doctor_id,specialty_id" });
    results.push(dsErr ? `Doctor-Specialties: ${dsErr.message}` : `Doctor-Specialties: ${doctorSpecialties.length} linked`);

    const doctorHospitals = [
      { doctor_id: "1", hospital_id: "1" }, { doctor_id: "2", hospital_id: "2" },
      { doctor_id: "3", hospital_id: "1" }, { doctor_id: "4", hospital_id: "2" },
      { doctor_id: "5", hospital_id: "5" }, { doctor_id: "6", hospital_id: "1" },
      { doctor_id: "7", hospital_id: "1" }, { doctor_id: "8", hospital_id: "8" },
      { doctor_id: "9", hospital_id: "2" }, { doctor_id: "10", hospital_id: "1" },
    ];
    const { error: dhErr } = await sb.from("doctor_hospitals").upsert(doctorHospitals, { onConflict: "doctor_id,hospital_id" });
    results.push(dhErr ? `Doctor-Hospitals: ${dhErr.message}` : `Doctor-Hospitals: ${doctorHospitals.length} linked`);

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}
