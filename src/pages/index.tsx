import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from "react-icons/fi";

import { dateFormat } from './../utils/dateFormat';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  const handleLoadPosts = async () => {
    const data = await fetch(nextPage).then(res => res.json());

    if (data.next_page) {
      setNextPage(data.next_page);
    } else {
      setNextPage(null);
    }

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  };

  return (
    <>
      <Head>
        <title>Posts | Spacetraveling</title>
      </Head>
      
      <main className={commonStyles.posts}>
        <div className={`${commonStyles.post} ${styles.post}`}>
          {posts.map((post, key) => (
            <Link key={key} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <time><FiCalendar /> {dateFormat(post.first_publication_date)}</time>
                  <span className={styles.author}><FiUser />{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <span className={styles.loadButton} onClick={handleLoadPosts}>
              Carregar mais posts
            </span>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 5,
  });
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};