-- Generated from prod via backend/dev.sh dump-schema. Do not hand-edit; re-run the command after prod migrations.
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.11 (8a81ecb)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    contact_id integer NOT NULL,
    fullname character varying(128) NOT NULL,
    location character varying(128),
    coordinates public.geography(Point,4326),
    metthrough character varying(256),
    userbio character varying(500),
    lastcontact date DEFAULT CURRENT_DATE,
    remind_in_weeks integer DEFAULT 0,
    remind_in_months integer DEFAULT 0,
    nextcontact date,
    embedding public.vector(1536),
    profile_pic_object_name character varying(128),
    user_id uuid NOT NULL,
    linked_user_id uuid
);


--
-- Name: contacts_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_contact_id_seq OWNED BY public.contacts.contact_id;


--
-- Name: sociallabels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sociallabels (
    id integer NOT NULL,
    label character varying(16)
);


--
-- Name: sociallabels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sociallabels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sociallabels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sociallabels_id_seq OWNED BY public.sociallabels.id;


--
-- Name: socials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socials (
    contact_id integer NOT NULL,
    social_id integer NOT NULL,
    address character varying(64)
);


--
-- Name: taglabels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taglabels (
    id integer NOT NULL,
    label character varying(16),
    user_id uuid NOT NULL
);


--
-- Name: taglabels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.taglabels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: taglabels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.taglabels_id_seq OWNED BY public.taglabels.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    contact_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_token character(32),
    username character varying(128) NOT NULL,
    password text NOT NULL,
    num_contacts integer DEFAULT 0,
    bio text,
    profile_pic_object_name character varying(128),
    location character varying(128),
    fullname character varying(128) NOT NULL,
    email character varying(256),
    is_public boolean DEFAULT false NOT NULL,
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    coordinates public.geography(Point,4326)
);


--
-- Name: contacts contact_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN contact_id SET DEFAULT nextval('public.contacts_contact_id_seq'::regclass);


--
-- Name: sociallabels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sociallabels ALTER COLUMN id SET DEFAULT nextval('public.sociallabels_id_seq'::regclass);


--
-- Name: taglabels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taglabels ALTER COLUMN id SET DEFAULT nextval('public.taglabels_id_seq'::regclass);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (contact_id);


--
-- Name: sociallabels sociallabels_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sociallabels
    ADD CONSTRAINT sociallabels_label_key UNIQUE (label);


--
-- Name: sociallabels sociallabels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sociallabels
    ADD CONSTRAINT sociallabels_pkey PRIMARY KEY (id);


--
-- Name: taglabels taglabels_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taglabels
    ADD CONSTRAINT taglabels_label_key UNIQUE (label);


--
-- Name: taglabels taglabels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taglabels
    ADD CONSTRAINT taglabels_pkey PRIMARY KEY (id);


--
-- Name: tags tags_contact_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_contact_id_tag_id_key UNIQUE (contact_id, tag_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: contacts_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_embedding_idx ON public.contacts USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: contacts_linked_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_linked_user_unique ON public.contacts USING btree (user_id, linked_user_id) WHERE (linked_user_id IS NOT NULL);


--
-- Name: locations_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_gix ON public.contacts USING gist (coordinates);


--
-- Name: users_coordinates_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_coordinates_gix ON public.users USING gist (coordinates);


--
-- Name: users_email_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_uq ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: users_username_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_uq ON public.users USING btree (username);


--
-- Name: contacts contacts_linked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: contacts contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: socials socials_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials
    ADD CONSTRAINT socials_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id) ON DELETE CASCADE;


--
-- Name: socials socials_social_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials
    ADD CONSTRAINT socials_social_id_fkey FOREIGN KEY (social_id) REFERENCES public.sociallabels(id) ON DELETE CASCADE;


--
-- Name: taglabels taglabels_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taglabels
    ADD CONSTRAINT taglabels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: tags tags_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id) ON DELETE CASCADE;


--
-- Name: tags tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.taglabels(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
