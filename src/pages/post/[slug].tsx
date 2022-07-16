import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { dateFormat } from '../../utils/dateFormat';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const [minutes] = useState(() => {
    const minutesToRead = post.data.content.reduce((acc, content) => {
      const text = content.body.reduce((acc, { text }) => {
        return acc + text;
      }, '');

      return acc + text.split(' ').length + content.heading.split(' ').length;
    }, 0);

    return Math.ceil(minutesToRead / 200);
  });

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      
      <main className={commonStyles.posts}>
        <img className={styles.banner} src={post.data.banner.url} alt={post.data.title} />
        <article className={`${commonStyles.post} ${styles.post}`}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <time><FiCalendar /> {dateFormat(post.first_publication_date)}</time>
            <span><FiUser />{post.data.author}</span>
            <span><FiClock /> {minutes} min</span>
          </div>
          {post.data.content.map((content, index) => {
            return (
              <div className={styles.content} key={index}>
                <h2>{content.heading}</h2>
                {content.body.map((paragraph, index) => {
                  return <p key={index}>{paragraph.text}</p>;
                })}
              </div>
            );
          })}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');
  const paths = posts.results.slice(0, 4).map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params  }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url ?? '',
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
    uid: response.uid,
    first_publication_date: response.first_publication_date,
  }

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};