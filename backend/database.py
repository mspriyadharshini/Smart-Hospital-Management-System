import mysql.connector


def get_db_connection():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="mspriya@123",
        database="smart_hospital_management"
    )

    return connection