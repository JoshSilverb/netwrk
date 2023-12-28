"""Helper functions.

helper functions to abstract little code pieces like get_followed
"""


def get_followed(cur, username):
    """Find accounts followed by user."""
    cur.execute(
        "SELECT username2 FROM following WHERE username1=%s",
        (username,)
    )
    followed = cur.fetchall()

    return followed


def insert_comment(username, postid, text, cur):
    """Insert a comment into the databse."""
    cur.execute(
        "INSERT INTO comments(owner, postid, text) \
        VALUES (%s, %s, %s)",
        (username, postid, text)
    )
