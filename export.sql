--
-- PostgreSQL database dump
--

-- Dumped from database version 11.2
-- Dumped by pg_dump version 11.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'WIN1251';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: events; Type: TABLE; Schema: public; Owner: NIP
--

CREATE TABLE public.events (
    id integer NOT NULL,
    name text,
    start_date bigint,
    end_date bigint
);


ALTER TABLE public.events OWNER TO "NIP";

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: NIP
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.events_id_seq OWNER TO "NIP";

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: NIP
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: NIP
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text,
    password text,
    token text,
    expire numeric
);


ALTER TABLE public.users OWNER TO "NIP";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: NIP
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "NIP";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: NIP
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: NIP
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: NIP
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: NIP
--

COPY public.events (id, name, start_date, end_date) FROM stdin;
2	http:&#x2F;&#x2F;vk.cc&#x2F;!@#$%^&amp;*()@#$%^&amp;*()WERT&amp;345678	1	10000
3	http:&#x2F;&#x2F;vk.cc&#x2F;!@#$%^&amp;*()@#$%^&amp;*()WERT&amp;345678	1	10000
4	http:&#x2F;&#x2F;vk.cc&#x2F;!@#$%^&amp;*()@#$%^&amp;*()WERT&amp;345678	1	10000
5	trix	1	10000
6	trix	777	10000
7	strix	2	10000
1	12345	2	10000
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: NIP
--

COPY public.users (id, username, password, token, expire) FROM stdin;
1	admin@gmail.com	3640c608a0b815c1d5e24e46cb1759e7	d5b68c68-86f4-4c57-bc6c-504f6b312acb	1551748639
\.


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: NIP
--

SELECT pg_catalog.setval('public.events_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: NIP
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: NIP
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

