from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
import os
import random
import smtplib

from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash


load_dotenv()

otp_storage = {}


# ==========================================
# CREATE FLASK APP
# ==========================================

app = Flask(__name__)
CORS(app)


# ==========================================
# HOME API
# ==========================================

@app.route("/")
def home():
    return jsonify({
        "message": "Smart Hospital API Working"
    })


# ==========================================
# DASHBOARD API
# ==========================================

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # PATIENTS
        cursor.execute(
            "SELECT COUNT(*) AS count FROM patients"
        )
        patients_count = cursor.fetchone()["count"]

        # DOCTORS
        cursor.execute(
            "SELECT COUNT(*) AS count FROM doctors"
        )
        doctors_count = cursor.fetchone()["count"]

        # APPOINTMENTS
        cursor.execute(
            "SELECT COUNT(*) AS count FROM appointments"
        )
        appointments_count = cursor.fetchone()["count"]

        # MEDICINES
        cursor.execute(
            "SELECT COUNT(*) AS count FROM medicines"
        )
        medicines_count = cursor.fetchone()["count"]

        # BILLS
        cursor.execute(
            "SELECT COUNT(*) AS count FROM bills"
        )
        bills_count = cursor.fetchone()["count"]

        # REVENUE
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) AS total
            FROM bills
            WHERE payment_status = 'Paid'
        """)
        revenue = cursor.fetchone()["total"]

        # TOTAL BEDS
        cursor.execute(
            "SELECT COUNT(*) AS count FROM beds"
        )
        beds_count = cursor.fetchone()["count"]

        # AVAILABLE BEDS
        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM beds
            WHERE status = 'Available'
        """)
        available_beds = cursor.fetchone()["count"]

        # OCCUPIED BEDS
        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM beds
            WHERE status = 'Occupied'
        """)
        occupied_beds = cursor.fetchone()["count"]

        # MAINTENANCE BEDS
        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM beds
            WHERE status = 'Maintenance'
        """)
        maintenance_beds = cursor.fetchone()["count"]

        return jsonify({
            "patients": patients_count,
            "doctors": doctors_count,
            "appointments": appointments_count,
            "medicines": medicines_count,
            "bills": bills_count,
            "revenue": float(revenue or 0),
            "beds": beds_count,
            "available_beds": available_beds,
            "occupied_beds": occupied_beds,
            "maintenance_beds": maintenance_beds
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==========================================
# PATIENT APIs
# ==========================================

# GET ALL PATIENTS
@app.route("/api/patients", methods=["GET"])
def get_patients():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM patients
            ORDER BY id DESC
        """)

        patients = cursor.fetchall()

        return jsonify(patients)

    finally:

        cursor.close()
        connection.close()


# ADD PATIENT
@app.route("/api/patients", methods=["POST"])
def add_patient():

    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        query = """
            INSERT INTO patients
            (
                patient_id,
                name,
                age,
                gender,
                phone,
                blood_group,
                address,
                disease
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            data.get("patient_id"),
            data.get("name"),
            data.get("age"),
            data.get("gender"),
            data.get("phone"),
            data.get("blood_group"),
            data.get("address"),
            data.get("disease")
        )

        cursor.execute(query, values)
        connection.commit()

        return jsonify({
            "message": "Patient registered successfully"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# GET SINGLE PATIENT
@app.route("/api/patients/<int:id>", methods=["GET"])
def get_patient(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM patients WHERE id = %s",
            (id,)
        )

        patient = cursor.fetchone()

        if patient is None:

            return jsonify({
                "message": "Patient not found"
            }), 404

        return jsonify(patient)

    finally:

        cursor.close()
        connection.close()


# UPDATE PATIENT
@app.route("/api/patients/<int:id>", methods=["PUT"])
def update_patient(id):

    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE patients
            SET
                patient_id = %s,
                name = %s,
                age = %s,
                gender = %s,
                phone = %s,
                blood_group = %s,
                disease = %s,
                address = %s
            WHERE id = %s
        """, (
            data.get("patient_id"),
            data.get("name"),
            data.get("age"),
            data.get("gender"),
            data.get("phone"),
            data.get("blood_group"),
            data.get("disease"),
            data.get("address"),
            id
        ))

        connection.commit()

        return jsonify({
            "message": "Patient updated successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE PATIENT
@app.route("/api/patients/<int:id>", methods=["DELETE"])
def delete_patient(id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            "DELETE FROM patients WHERE id = %s",
            (id,)
        )

        connection.commit()

        return jsonify({
            "message": "Patient deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# ==========================================
# APPOINTMENT APIs
# ==========================================

# GET ALL APPOINTMENTS
@app.route("/api/appointments", methods=["GET"])
def get_appointments():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM appointments
            ORDER BY appointment_date DESC,
                     appointment_time DESC
        """)

        appointments = cursor.fetchall()

        for appointment in appointments:

            if appointment.get("appointment_time") is not None:
                appointment["appointment_time"] = str(
                    appointment["appointment_time"]
                )

            if appointment.get("appointment_date") is not None:
                appointment["appointment_date"] = str(
                    appointment["appointment_date"]
                )

            if appointment.get("created_at") is not None:
                appointment["created_at"] = str(
                    appointment["created_at"]
                )

        return jsonify(appointments)

    finally:

        cursor.close()
        connection.close()


# GET SINGLE APPOINTMENT
@app.route("/api/appointments/<int:id>", methods=["GET"])
def get_appointment(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM appointments WHERE id = %s",
            (id,)
        )

        appointment = cursor.fetchone()

        if appointment is None:

            return jsonify({
                "message": "Appointment not found"
            }), 404

        if appointment.get("appointment_time") is not None:
            appointment["appointment_time"] = str(
                appointment["appointment_time"]
            )

        if appointment.get("appointment_date") is not None:
            appointment["appointment_date"] = str(
                appointment["appointment_date"]
            )

        if appointment.get("created_at") is not None:
            appointment["created_at"] = str(
                appointment["created_at"]
            )

        return jsonify(appointment)

    finally:

        cursor.close()
        connection.close()


# BOOK APPOINTMENT
@app.route("/api/appointments", methods=["POST"])
def add_appointment():

    data = request.get_json()

    patient_id = data.get("patient_id")
    doctor_name = data.get("doctor_name")
    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")
    reason = data.get("reason")
    status = data.get("status", "Scheduled")

    if not patient_id or not doctor_name:

        return jsonify({
            "message": "Patient and Doctor are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO appointments
            (
                patient_id,
                doctor_name,
                appointment_date,
                appointment_time,
                reason,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            patient_id,
            doctor_name,
            appointment_date,
            appointment_time,
            reason,
            status
        ))

        connection.commit()

        return jsonify({
            "message": "Appointment booked successfully"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# UPDATE APPOINTMENT
@app.route("/api/appointments/<int:id>", methods=["PUT"])
def update_appointment(id):

    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE appointments
            SET
                patient_id = %s,
                doctor_name = %s,
                appointment_date = %s,
                appointment_time = %s,
                reason = %s,
                status = %s
            WHERE id = %s
        """, (
            data.get("patient_id"),
            data.get("doctor_name"),
            data.get("appointment_date"),
            data.get("appointment_time"),
            data.get("reason"),
            data.get("status"),
            id
        ))

        connection.commit()

        return jsonify({
            "message": "Appointment updated successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE APPOINTMENT
@app.route("/api/appointments/<int:id>", methods=["DELETE"])
def delete_appointment(id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            "DELETE FROM appointments WHERE id = %s",
            (id,)
        )

        connection.commit()

        return jsonify({
            "message": "Appointment deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# ==========================================
# DOCTOR APIs
# ==========================================

# GET ALL DOCTORS
@app.route("/api/doctors", methods=["GET"])
def get_doctors():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM doctors
            ORDER BY id DESC
        """)

        doctors = cursor.fetchall()

        for doctor in doctors:

            if doctor.get("created_at") is not None:
                doctor["created_at"] = str(
                    doctor["created_at"]
                )

        return jsonify(doctors)

    finally:

        cursor.close()
        connection.close()


# GET SINGLE DOCTOR
@app.route("/api/doctors/<int:id>", methods=["GET"])
def get_doctor(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM doctors WHERE id = %s",
            (id,)
        )

        doctor = cursor.fetchone()

        if doctor is None:

            return jsonify({
                "message": "Doctor not found"
            }), 404

        if doctor.get("created_at") is not None:
            doctor["created_at"] = str(
                doctor["created_at"]
            )

        return jsonify(doctor)

    finally:

        cursor.close()
        connection.close()


# ADD DOCTOR
@app.route("/api/doctors", methods=["POST"])
def add_doctor():

    data = request.get_json()

    doctor_id = data.get("doctor_id")
    name = data.get("name")
    specialization = data.get("specialization")
    phone = data.get("phone")
    email = data.get("email")
    experience = data.get("experience")
    availability = data.get("availability", "Available")

    if not doctor_id or not name or not specialization:

        return jsonify({
            "message": "Doctor ID, Name and Specialization are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO doctors
            (
                doctor_id,
                name,
                specialization,
                phone,
                email,
                experience,
                availability
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            doctor_id,
            name,
            specialization,
            phone,
            email,
            experience,
            availability
        ))

        connection.commit()

        return jsonify({
            "message": "Doctor added successfully"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# UPDATE DOCTOR
@app.route("/api/doctors/<int:id>", methods=["PUT"])
def update_doctor(id):

    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE doctors
            SET
                doctor_id = %s,
                name = %s,
                specialization = %s,
                phone = %s,
                email = %s,
                experience = %s,
                availability = %s
            WHERE id = %s
        """, (
            data.get("doctor_id"),
            data.get("name"),
            data.get("specialization"),
            data.get("phone"),
            data.get("email"),
            data.get("experience"),
            data.get("availability"),
            id
        ))

        connection.commit()

        return jsonify({
            "message": "Doctor updated successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE DOCTOR
@app.route("/api/doctors/<int:id>", methods=["DELETE"])
def delete_doctor(id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            "DELETE FROM doctors WHERE id = %s",
            (id,)
        )

        connection.commit()

        return jsonify({
            "message": "Doctor deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# ==========================================
# BILLING APIs
# ==========================================

# GET ALL BILLS
@app.route("/api/bills", methods=["GET"])
def get_bills():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM bills
            ORDER BY id DESC
        """)

        bills = cursor.fetchall()

        for bill in bills:

            if bill.get("bill_date") is not None:
                bill["bill_date"] = str(
                    bill["bill_date"]
                )

            if bill.get("created_at") is not None:
                bill["created_at"] = str(
                    bill["created_at"]
                )

            for field in [
                "consultation_fee",
                "medicine_fee",
                "lab_fee",
                "room_fee",
                "other_charges",
                "total_amount"
            ]:

                if bill.get(field) is not None:
                    bill[field] = float(
                        bill[field]
                    )

        return jsonify(bills)

    finally:

        cursor.close()
        connection.close()


# GET SINGLE BILL
@app.route("/api/bills/<int:id>", methods=["GET"])
def get_bill(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM bills WHERE id = %s",
            (id,)
        )

        bill = cursor.fetchone()

        if bill is None:

            return jsonify({
                "message": "Bill not found"
            }), 404

        if bill.get("bill_date") is not None:
            bill["bill_date"] = str(
                bill["bill_date"]
            )

        if bill.get("created_at") is not None:
            bill["created_at"] = str(
                bill["created_at"]
            )

        for field in [
            "consultation_fee",
            "medicine_fee",
            "lab_fee",
            "room_fee",
            "other_charges",
            "total_amount"
        ]:

            if bill.get(field) is not None:
                bill[field] = float(
                    bill[field]
                )

        return jsonify(bill)

    finally:

        cursor.close()
        connection.close()


# CREATE BILL
@app.route("/api/bills", methods=["POST"])
def add_bill():

    data = request.get_json()

    bill_id = data.get("bill_id")
    patient_id = data.get("patient_id")
    bill_date = data.get("bill_date")

    try:

        consultation_fee = float(
            data.get("consultation_fee", 0)
        )

        medicine_fee = float(
            data.get("medicine_fee", 0)
        )

        lab_fee = float(
            data.get("lab_fee", 0)
        )

        room_fee = float(
            data.get("room_fee", 0)
        )

        other_charges = float(
            data.get("other_charges", 0)
        )

    except (TypeError, ValueError):

        return jsonify({
            "error": "Invalid fee value"
        }), 400

    payment_status = data.get(
        "payment_status",
        "Pending"
    )

    total_amount = (
        consultation_fee
        + medicine_fee
        + lab_fee
        + room_fee
        + other_charges
    )

    if not bill_id or not patient_id or not bill_date:

        return jsonify({
            "message": "Bill ID, Patient ID and Bill Date are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO bills
            (
                bill_id,
                patient_id,
                bill_date,
                consultation_fee,
                medicine_fee,
                lab_fee,
                room_fee,
                other_charges,
                total_amount,
                payment_status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            bill_id,
            patient_id,
            bill_date,
            consultation_fee,
            medicine_fee,
            lab_fee,
            room_fee,
            other_charges,
            total_amount,
            payment_status
        ))

        connection.commit()

        return jsonify({
            "message": "Bill created successfully",
            "total_amount": total_amount
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# UPDATE BILL
@app.route("/api/bills/<int:id>", methods=["PUT"])
def update_bill(id):

    data = request.get_json()

    try:

        consultation_fee = float(
            data.get("consultation_fee", 0)
        )

        medicine_fee = float(
            data.get("medicine_fee", 0)
        )

        lab_fee = float(
            data.get("lab_fee", 0)
        )

        room_fee = float(
            data.get("room_fee", 0)
        )

        other_charges = float(
            data.get("other_charges", 0)
        )

    except (TypeError, ValueError):

        return jsonify({
            "error": "Invalid fee value"
        }), 400

    total_amount = (
        consultation_fee
        + medicine_fee
        + lab_fee
        + room_fee
        + other_charges
    )

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE bills
            SET
                bill_id = %s,
                patient_id = %s,
                bill_date = %s,
                consultation_fee = %s,
                medicine_fee = %s,
                lab_fee = %s,
                room_fee = %s,
                other_charges = %s,
                total_amount = %s,
                payment_status = %s
            WHERE id = %s
        """, (
            data.get("bill_id"),
            data.get("patient_id"),
            data.get("bill_date"),
            consultation_fee,
            medicine_fee,
            lab_fee,
            room_fee,
            other_charges,
            total_amount,
            data.get("payment_status"),
            id
        ))

        connection.commit()

        return jsonify({
            "message": "Bill updated successfully",
            "total_amount": total_amount
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE BILL
@app.route("/api/bills/<int:id>", methods=["DELETE"])
def delete_bill(id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            "DELETE FROM bills WHERE id = %s",
            (id,)
        )

        connection.commit()

        return jsonify({
            "message": "Bill deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# ==========================================
# PHARMACY APIs
# ==========================================

# GET ALL MEDICINES
@app.route("/api/medicines", methods=["GET"])
def get_medicines():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                medicine_id,
                medicine_name,
                category,
                quantity,
                price,
                expiry_date,
                supplier,
                status,
                created_at
            FROM medicines
            ORDER BY id DESC
        """)

        medicines = cursor.fetchall()

        for medicine in medicines:

            if medicine.get("expiry_date"):
                medicine["expiry_date"] = str(
                    medicine["expiry_date"]
                )

            if medicine.get("created_at"):
                medicine["created_at"] = str(
                    medicine["created_at"]
                )

            medicine["price"] = float(
                medicine.get("price") or 0
            )

            medicine["quantity"] = int(
                medicine.get("quantity") or 0
            )

        return jsonify(medicines)

    finally:

        cursor.close()
        conn.close()


# GET SINGLE MEDICINE
@app.route("/api/medicines/<int:id>", methods=["GET"])
def get_medicine(id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM medicines WHERE id = %s",
            (id,)
        )

        medicine = cursor.fetchone()

        if not medicine:

            return jsonify({
                "error": "Medicine not found"
            }), 404

        if medicine.get("expiry_date"):
            medicine["expiry_date"] = str(
                medicine["expiry_date"]
            )

        if medicine.get("created_at"):
            medicine["created_at"] = str(
                medicine["created_at"]
            )

        medicine["price"] = float(
            medicine.get("price") or 0
        )

        medicine["quantity"] = int(
            medicine.get("quantity") or 0
        )

        return jsonify(medicine)

    finally:

        cursor.close()
        conn.close()


# ADD MEDICINE
@app.route("/api/medicines", methods=["POST"])
def add_medicine():

    data = request.get_json()

    medicine_id = data.get("medicine_id")
    medicine_name = data.get("medicine_name")
    category = data.get("category")
    quantity = data.get("quantity", 0)
    price = data.get("price", 0)
    expiry_date = data.get("expiry_date")
    supplier = data.get("supplier")
    status = data.get("status", "Available")

    if not medicine_id or not medicine_name:

        return jsonify({
            "error": "Medicine ID and Medicine Name are required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            INSERT INTO medicines
            (
                medicine_id,
                medicine_name,
                category,
                quantity,
                price,
                expiry_date,
                supplier,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            medicine_id,
            medicine_name,
            category,
            quantity,
            price,
            expiry_date,
            supplier,
            status
        ))

        conn.commit()

        return jsonify({
            "message": "Medicine added successfully",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# UPDATE MEDICINE
@app.route("/api/medicines/<int:id>", methods=["PUT"])
def update_medicine(id):

    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            UPDATE medicines
            SET
                medicine_id = %s,
                medicine_name = %s,
                category = %s,
                quantity = %s,
                price = %s,
                expiry_date = %s,
                supplier = %s,
                status = %s
            WHERE id = %s
        """, (
            data.get("medicine_id"),
            data.get("medicine_name"),
            data.get("category"),
            data.get("quantity", 0),
            data.get("price", 0),
            data.get("expiry_date"),
            data.get("supplier"),
            data.get("status", "Available"),
            id
        ))

        connection_message = cursor.rowcount

        conn.commit()

        if connection_message == 0:

            return jsonify({
                "error": "Medicine not found"
            }), 404

        return jsonify({
            "message": "Medicine updated successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# DELETE MEDICINE
@app.route("/api/medicines/<int:id>", methods=["DELETE"])
def delete_medicine(id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "DELETE FROM medicines WHERE id = %s",
            (id,)
        )

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Medicine not found"
            }), 404

        return jsonify({
            "message": "Medicine deleted successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# ==========================================
# BED MANAGEMENT APIs
# ==========================================

# GET ALL BEDS
@app.route("/api/beds", methods=["GET"])
def get_beds():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                bed_id,
                ward,
                room_number,
                bed_type,
                patient_id,
                status,
                created_at
            FROM beds
            ORDER BY id DESC
        """)

        beds = cursor.fetchall()

        for bed in beds:

            if bed.get("created_at"):
                bed["created_at"] = str(
                    bed["created_at"]
                )

        return jsonify(beds)

    finally:

        cursor.close()
        conn.close()


# GET SINGLE BED
@app.route("/api/beds/<int:id>", methods=["GET"])
def get_bed(id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            "SELECT * FROM beds WHERE id = %s",
            (id,)
        )

        bed = cursor.fetchone()

        if not bed:

            return jsonify({
                "error": "Bed not found"
            }), 404

        if bed.get("created_at"):
            bed["created_at"] = str(
                bed["created_at"]
            )

        return jsonify(bed)

    finally:

        cursor.close()
        conn.close()


# ADD BED
@app.route("/api/beds", methods=["POST"])
def add_bed():

    data = request.get_json()

    bed_id = data.get("bed_id")
    ward = data.get("ward")
    room_number = data.get("room_number")
    bed_type = data.get("bed_type", "General")
    patient_id = data.get("patient_id")
    status = data.get("status", "Available")

    if not bed_id or not ward or not room_number:

        return jsonify({
            "error": "Bed ID, Ward and Room Number are required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            INSERT INTO beds
            (
                bed_id,
                ward,
                room_number,
                bed_type,
                patient_id,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            bed_id,
            ward,
            room_number,
            bed_type,
            patient_id,
            status
        ))

        conn.commit()

        return jsonify({
            "message": "Bed added successfully",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# UPDATE BED
@app.route("/api/beds/<int:id>", methods=["PUT"])
def update_bed(id):

    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            UPDATE beds
            SET
                bed_id = %s,
                ward = %s,
                room_number = %s,
                bed_type = %s,
                patient_id = %s,
                status = %s
            WHERE id = %s
        """, (
            data.get("bed_id"),
            data.get("ward"),
            data.get("room_number"),
            data.get("bed_type", "General"),
            data.get("patient_id"),
            data.get("status", "Available"),
            id
        ))

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Bed not found"
            }), 404

        return jsonify({
            "message": "Bed updated successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# DELETE BED
@app.route("/api/beds/<int:id>", methods=["DELETE"])
def delete_bed(id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            "DELETE FROM beds WHERE id = %s",
            (id,)
        )

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Bed not found"
            }), 404

        return jsonify({
            "message": "Bed deleted successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# ==========================================
# PATIENT BED DETAILS API
# ==========================================

@app.route("/api/patients/<patient_id>/bed", methods=["GET"])
def get_patient_bed(patient_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                bed_id,
                ward,
                room_number,
                bed_type,
                patient_id,
                status,
                created_at
            FROM beds
            WHERE patient_id = %s
            AND status = 'Occupied'
            LIMIT 1
        """, (patient_id,))

        bed = cursor.fetchone()

        if bed and bed.get("created_at"):
            bed["created_at"] = str(
                bed["created_at"]
            )

        return jsonify(bed if bed else {})

    finally:

        cursor.close()
        conn.close()

# ==========================================
# ADMISSION / DISCHARGE APIs
# ==========================================

# GET ALL ADMISSIONS
@app.route("/api/admissions", methods=["GET"])
def get_admissions():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM admissions
            ORDER BY id DESC
        """)

        admissions = cursor.fetchall()

        for admission in admissions:

            if admission.get("admission_date") is not None:
                admission["admission_date"] = str(
                    admission["admission_date"]
                )

            if admission.get("admission_time") is not None:
                admission["admission_time"] = str(
                    admission["admission_time"]
                )

            if admission.get("discharge_date") is not None:
                admission["discharge_date"] = str(
                    admission["discharge_date"]
                )

            if admission.get("discharge_time") is not None:
                admission["discharge_time"] = str(
                    admission["discharge_time"]
                )

            if admission.get("created_at") is not None:
                admission["created_at"] = str(
                    admission["created_at"]
                )

        return jsonify(admissions)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        connection.close()


# GET SINGLE ADMISSION
@app.route("/api/admissions/<int:id>", methods=["GET"])
def get_admission(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM admissions
            WHERE id = %s
        """, (id,))

        admission = cursor.fetchone()

        if not admission:

            return jsonify({
                "error": "Admission not found"
            }), 404

        if admission.get("admission_date") is not None:
            admission["admission_date"] = str(
                admission["admission_date"]
            )

        if admission.get("admission_time") is not None:
            admission["admission_time"] = str(
                admission["admission_time"]
            )

        if admission.get("discharge_date") is not None:
            admission["discharge_date"] = str(
                admission["discharge_date"]
            )

        if admission.get("discharge_time") is not None:
            admission["discharge_time"] = str(
                admission["discharge_time"]
            )

        if admission.get("created_at") is not None:
            admission["created_at"] = str(
                admission["created_at"]
            )

        return jsonify(admission)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        connection.close()


# ADD ADMISSION
@app.route("/api/admissions", methods=["POST"])
def add_admission():

    data = request.get_json()

    admission_id = data.get("admission_id")
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    bed_id = data.get("bed_id")
    admission_date = data.get("admission_date")
    admission_time = data.get("admission_time")
    diagnosis = data.get("diagnosis")
    treatment_notes = data.get("treatment_notes")
    status = data.get("status", "Admitted")

    if not admission_id:
        return jsonify({
            "error": "Admission ID is required"
        }), 400

    if not patient_id:
        return jsonify({
            "error": "Patient ID is required"
        }), 400

    if not admission_date:
        return jsonify({
            "error": "Admission date is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        # CHECK PATIENT
        cursor.execute("""
            SELECT id
            FROM patients
            WHERE patient_id = %s
        """, (patient_id,))

        patient = cursor.fetchone()

        if not patient:

            return jsonify({
                "error": "Patient not found"
            }), 404

        # CHECK DUPLICATE ADMISSION ID
        cursor.execute("""
            SELECT id
            FROM admissions
            WHERE admission_id = %s
        """, (admission_id,))

        existing_admission = cursor.fetchone()

        if existing_admission:

            return jsonify({
                "error": "Admission ID already exists"
            }), 400

        # CHECK BED
        if bed_id:

            cursor.execute("""
                SELECT
                    id,
                    status,
                    patient_id
                FROM beds
                WHERE bed_id = %s
            """, (bed_id,))

            bed = cursor.fetchone()

            if not bed:

                return jsonify({
                    "error": "Bed not found"
                }), 404

            if bed[1] != "Available":

                return jsonify({
                    "error": "Selected bed is not available"
                }), 400

        # INSERT ADMISSION
        cursor.execute("""
            INSERT INTO admissions
            (
                admission_id,
                patient_id,
                doctor_id,
                bed_id,
                admission_date,
                admission_time,
                diagnosis,
                treatment_notes,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            admission_id,
            patient_id,
            doctor_id,
            bed_id,
            admission_date,
            admission_time,
            diagnosis,
            treatment_notes,
            status
        ))

        # OCCUPY BED
        if bed_id:

            cursor.execute("""
                UPDATE beds
                SET
                    patient_id = %s,
                    status = 'Occupied'
                WHERE bed_id = %s
            """, (
                patient_id,
                bed_id
            ))

        connection.commit()

        return jsonify({
            "message": "Patient admitted successfully",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# UPDATE ADMISSION
@app.route("/api/admissions/<int:id>", methods=["PUT"])
def update_admission(id):

    data = request.get_json()

    admission_id = data.get("admission_id")
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    bed_id = data.get("bed_id")
    admission_date = data.get("admission_date")
    admission_time = data.get("admission_time")
    discharge_date = data.get("discharge_date")
    discharge_time = data.get("discharge_time")
    diagnosis = data.get("diagnosis")
    treatment_notes = data.get("treatment_notes")
    status = data.get("status", "Admitted")

    if not admission_id or not patient_id or not admission_date:

        return jsonify({
            "error": "Admission ID, Patient ID and Admission Date are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # GET OLD ADMISSION
        cursor.execute("""
            SELECT *
            FROM admissions
            WHERE id = %s
        """, (id,))

        old_admission = cursor.fetchone()

        if not old_admission:

            return jsonify({
                "error": "Admission not found"
            }), 404

        old_bed_id = old_admission.get("bed_id")

        # CHECK DUPLICATE ADMISSION ID
        cursor.execute("""
            SELECT id
            FROM admissions
            WHERE admission_id = %s
            AND id != %s
        """, (
            admission_id,
            id
        ))

        duplicate = cursor.fetchone()

        if duplicate:

            return jsonify({
                "error": "Admission ID already exists"
            }), 400

        # CHECK NEW BED
        if bed_id and bed_id != old_bed_id:

            cursor.execute("""
                SELECT
                    id,
                    status
                FROM beds
                WHERE bed_id = %s
            """, (bed_id,))

            bed = cursor.fetchone()

            if not bed:

                return jsonify({
                    "error": "Bed not found"
                }), 404

            if bed["status"] != "Available":

                return jsonify({
                    "error": "Selected bed is not available"
                }), 400

        # UPDATE ADMISSION
        cursor.execute("""
            UPDATE admissions
            SET
                admission_id = %s,
                patient_id = %s,
                doctor_id = %s,
                bed_id = %s,
                admission_date = %s,
                admission_time = %s,
                discharge_date = %s,
                discharge_time = %s,
                diagnosis = %s,
                treatment_notes = %s,
                status = %s
            WHERE id = %s
        """, (
            admission_id,
            patient_id,
            doctor_id,
            bed_id,
            admission_date,
            admission_time,
            discharge_date,
            discharge_time,
            diagnosis,
            treatment_notes,
            status,
            id
        ))

        # RELEASE OLD BED
        if old_bed_id and old_bed_id != bed_id:

            cursor.execute("""
                UPDATE beds
                SET
                    patient_id = NULL,
                    status = 'Available'
                WHERE bed_id = %s
            """, (old_bed_id,))

        # OCCUPY NEW BED
        if bed_id:

            cursor.execute("""
                UPDATE beds
                SET
                    patient_id = %s,
                    status = 'Occupied'
                WHERE bed_id = %s
            """, (
                patient_id,
                bed_id
            ))

        connection.commit()

        return jsonify({
            "message": "Admission updated successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DISCHARGE PATIENT
@app.route("/api/admissions/<int:id>/discharge", methods=["PUT"])
def discharge_patient(id):

    data = request.get_json() or {}

    discharge_date = data.get("discharge_date")
    discharge_time = data.get("discharge_time")
    treatment_notes = data.get("treatment_notes")

    if not discharge_date:

        return jsonify({
            "error": "Discharge date is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # GET ADMISSION
        cursor.execute("""
            SELECT *
            FROM admissions
            WHERE id = %s
        """, (id,))

        admission = cursor.fetchone()

        if not admission:

            return jsonify({
                "error": "Admission not found"
            }), 404

        if admission["status"] == "Discharged":

            return jsonify({
                "error": "Patient is already discharged"
            }), 400

        bed_id = admission.get("bed_id")

        # UPDATE ADMISSION
        cursor.execute("""
            UPDATE admissions
            SET
                discharge_date = %s,
                discharge_time = %s,
                treatment_notes = %s,
                status = 'Discharged'
            WHERE id = %s
        """, (
            discharge_date,
            discharge_time,
            treatment_notes
                if treatment_notes is not None
                else admission.get("treatment_notes"),
            id
        ))

        # RELEASE BED
        if bed_id:

            cursor.execute("""
                UPDATE beds
                SET
                    patient_id = NULL,
                    status = 'Available'
                WHERE bed_id = %s
            """, (bed_id,))

        connection.commit()

        return jsonify({
            "message": "Patient discharged successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE ADMISSION
@app.route("/api/admissions/<int:id>", methods=["DELETE"])
def delete_admission(id):

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # GET ADMISSION
        cursor.execute("""
            SELECT *
            FROM admissions
            WHERE id = %s
        """, (id,))

        admission = cursor.fetchone()

        if not admission:

            return jsonify({
                "error": "Admission not found"
            }), 404

        bed_id = admission.get("bed_id")

        # RELEASE BED
        if bed_id and admission.get("status") != "Discharged":

            cursor.execute("""
                UPDATE beds
                SET
                    patient_id = NULL,
                    status = 'Available'
                WHERE bed_id = %s
            """, (bed_id,))

        # DELETE ADMISSION
        cursor.execute("""
            DELETE FROM admissions
            WHERE id = %s
        """, (id,))

        connection.commit()

        return jsonify({
            "message": "Admission deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()
# ==========================================
# REGISTER / CREATE ACCOUNT API
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        username = data.get("username", "").strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")
        email = data.get("email", "").strip().lower()
        role = data.get("role", "").strip()

        # -----------------------------
        # VALIDATION
        # -----------------------------

        if not username:
            return jsonify({
                "success": False,
                "message": "Username is required"
            }), 400

        if not password:
            return jsonify({
                "success": False,
                "message": "Password is required"
            }), 400

        if password != confirm_password:
            return jsonify({
                "success": False,
                "message": "Passwords do not match"
            }), 400

        if len(password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must contain at least 6 characters"
            }), 400

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        if role not in ["Admin", "Doctor"]:
            return jsonify({
                "success": False,
                "message": "Please select Admin or Doctor"
            }), 400

        # -----------------------------
        # DATABASE
        # -----------------------------

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        # -----------------------------
        # CHECK USERNAME
        # -----------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(username) = %s
            LIMIT 1
            """,
            (username.lower(),)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            return jsonify({
                "success": False,
                "message": "Username already exists. Please choose another username."
            }), 409

        # -----------------------------
        # CHECK EMAIL
        # -----------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(email) = %s
            LIMIT 1
            """,
            (email,)
        )

        existing_email = cursor.fetchone()

        if existing_email:

            return jsonify({
                "success": False,
                "message": "Email already registered."
            }), 409

        # -----------------------------
        # HASH PASSWORD
        # -----------------------------

        hashed_password = generate_password_hash(password)

        # -----------------------------
        # CREATE USER
        # -----------------------------

        cursor.execute(
            """
            INSERT INTO users
            (
                username,
                password,
                role,
                email
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                username,
                hashed_password,
                role,
                email
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully. Please login."
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        print("REGISTER ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to create account",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# LOGIN API
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        username = data.get("username", "").strip()
        password = data.get("password", "")
        expected_role = data.get("expected_role", "").strip()

        if not username or not password:

            return jsonify({
                "success": False,
                "message": "Username and password are required"
            }), 400

        if not expected_role:

            return jsonify({
                "success": False,
                "message": "Please select login type"
            }), 400

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                username,
                password,
                role,
                email
            FROM users
            WHERE LOWER(username) = %s
            LIMIT 1
            """,
            (username.lower(),)
        )

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401

        # -----------------------------
        # PASSWORD CHECK
        # -----------------------------

        stored_password = user["password"]

        password_valid = False

        # New registered users = hashed password
        try:

            password_valid = check_password_hash(
                stored_password,
                password
            )

        except Exception:

            password_valid = False

        # Old users = plain password support
        if not password_valid:

            if stored_password == password:
                password_valid = True

        if not password_valid:

            return jsonify({
                "success": False,
                "message": "Invalid username or password"
            }), 401

        # -----------------------------
        # ROLE CHECK
        # -----------------------------

        database_role = str(
            user.get("role", "")
        ).strip().lower()

        selected_role = expected_role.lower()

        if database_role != selected_role:

            return jsonify({
                "success": False,
                "message":
                    f"This account is registered as {user['role']}, "
                    f"not {expected_role}."
            }), 403

        # Don't send password to frontend
        user.pop("password", None)

        return jsonify({

            "success": True,

            "message": "Login successful",

            "user": user

        }), 200

    except Exception as e:

        print("LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Server error during login"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
# ==========================================
# USER MANAGEMENT APIs
# ==========================================

# GET USERS
@app.route("/api/users", methods=["GET"])
def get_users():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                username,
                role,
                created_at
            FROM users
            ORDER BY id DESC
        """)

        users = cursor.fetchall()

        for user in users:

            if user.get("created_at"):
                user["created_at"] = str(
                    user["created_at"]
                )

        return jsonify(users)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        connection.close()


# ADD USER
@app.route("/api/users", methods=["POST"])
def add_user():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "Receptionist")

    if not username or not password:

        return jsonify({
            "error": "Username and password are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO users
            (
                username,
                password,
                role
            )
            VALUES (%s, %s, %s)
        """, (
            username,
            password,
            role
        ))

        connection.commit()

        return jsonify({
            "message": "User added successfully"
        }), 201

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# UPDATE USER
@app.route("/api/users/<int:id>", methods=["PUT"])
def update_user(id):

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        if password:

            cursor.execute("""
                UPDATE users
                SET
                    username = %s,
                    password = %s,
                    role = %s
                WHERE id = %s
            """, (
                username,
                password,
                role,
                id
            ))

        else:

            cursor.execute("""
                UPDATE users
                SET
                    username = %s,
                    role = %s
                WHERE id = %s
            """, (
                username,
                role,
                id
            ))

        connection.commit()

        return jsonify({
            "message": "User updated successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()


# DELETE USER
@app.route("/api/users/<int:id>", methods=["DELETE"])
def delete_user(id):

    connection = get_db_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM users
            WHERE id = %s
        """, (id,))

        connection.commit()

        return jsonify({
            "message": "User deleted successfully"
        })

    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        connection.close()

# ============================================================
# FORGOT PASSWORD
# ============================================================

otp_storage = {}


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():

    connection = None
    cursor = None

    try:

        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        # ----------------------------------------
        # CHECK EMAIL IN DATABASE
        # ----------------------------------------

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, username, email
            FROM users
            WHERE LOWER(email) = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()

        cursor.close()
        cursor = None

        connection.close()
        connection = None

        if not user:
            return jsonify({
                "success": False,
                "message": "Email is not registered."
            }), 404

        # ----------------------------------------
        # GENERATE OTP
        # ----------------------------------------

        otp = str(random.randint(100000, 999999))

        expires_at = datetime.now() + timedelta(minutes=5)

        otp_storage[email] = {
            "otp": otp,
            "expires_at": expires_at
        }

        # ----------------------------------------
        # DEMO MODE
        # OTP WILL APPEAR IN FLASK TERMINAL
        # ----------------------------------------

        print("")
        print("======================================")
        print("       SMART HOSPITAL OTP")
        print("======================================")
        print("Email :", email)
        print("OTP   :", otp)
        print("Valid : 5 minutes")
        print("======================================")
        print("")

        return jsonify({
            "success": True,
            "message": "OTP generated successfully.",
            "demo_otp": otp
        }), 200

    except Exception as e:

        print("FORGOT PASSWORD ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to generate OTP.",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# RESET PASSWORD
# ============================================================

@app.route("/api/reset-password", methods=["POST"])
def reset_password():

    connection = None
    cursor = None

    try:

        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        otp = data.get("otp", "").strip()
        new_password = data.get("new_password", "")

        # ----------------------------------------
        # VALIDATION
        # ----------------------------------------

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        if not otp:
            return jsonify({
                "success": False,
                "message": "OTP is required"
            }), 400

        if not new_password:
            return jsonify({
                "success": False,
                "message": "New password is required"
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must contain at least 6 characters"
            }), 400

        # ----------------------------------------
        # CHECK OTP
        # ----------------------------------------

        saved_otp = otp_storage.get(email)

        if not saved_otp:

            return jsonify({
                "success": False,
                "message": "OTP not found. Please request a new OTP."
            }), 400

        # ----------------------------------------
        # CHECK EXPIRY
        # ----------------------------------------

        if datetime.now() > saved_otp["expires_at"]:

            otp_storage.pop(email, None)

            return jsonify({
                "success": False,
                "message": "OTP expired. Please request a new OTP."
            }), 400

        # ----------------------------------------
        # CHECK OTP
        # ----------------------------------------

        if saved_otp["otp"] != otp:

            return jsonify({
                "success": False,
                "message": "Invalid OTP."
            }), 400

        # ----------------------------------------
        # HASH NEW PASSWORD
        # ----------------------------------------

        hashed_password = generate_password_hash(
            new_password
        )

        # ----------------------------------------
        # UPDATE DATABASE
        # ----------------------------------------

        connection = get_db_connection()

        if connection is None:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE users
            SET password = %s
            WHERE LOWER(email) = %s
            """,
            (
                hashed_password,
                email
            )
        )

        connection.commit()

        # Remove OTP after successful reset

        otp_storage.pop(email, None)

        return jsonify({
            "success": True,
            "message": "Password reset successfully."
        }), 200

    except Exception as e:

        if connection:
            connection.rollback()

        print("RESET PASSWORD ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to reset password.",
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()
# ==========================================
# START FLASK SERVER
# ==========================================
if __name__ == "__main__":
    app.run(debug=True)