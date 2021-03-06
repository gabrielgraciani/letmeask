import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiSun, FiMoon, FiThumbsUp } from 'react-icons/fi';

import logoImg from '../assets/images/logo.svg';
import logoDarkImg from '../assets/images/logo-dark.svg';

import { Button } from '../components/Button';
import { Question } from '../components/Question';
import { RoomCode } from '../components/RoomCode';

import { useAuth } from '../hooks/useAuth';
import { useRoom } from '../hooks/useRoom';
import { useTheme } from '../hooks/useTheme';
import { database } from '../services/firebase';

import {
  FormContainer,
  HeaderContainer,
  IconButton,
  QuestionList,
  RoomContainer,
} from '../styles/pages/Room';

type RoomParams = {
  id: string;
};

export const Room: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const params = useParams<RoomParams>();
  const [newQuestion, setNewQuestion] = useState('');

  const { theme, toggleTheme } = useTheme();

  const roomId = params.id;

  const { title, questions } = useRoom(roomId);

  async function handleSendQuestion(event: React.FormEvent) {
    event.preventDefault();

    if (newQuestion.trim() === '') {
      return;
    }

    if (!user) {
      throw new Error('You must be logged in');
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighlighted: false,
      isAnswered: false,
    };

    await database.ref(`rooms/${roomId}/questions`).push(question);

    setNewQuestion('');
  }

  async function handleLikeQuestion(
    questionId: string,
    likeId: string | undefined
  ) {
    if (likeId) {
      await database
        .ref(`rooms/${roomId}/questions/${questionId}/likes/${likeId}`)
        .remove();
    } else {
      await database.ref(`rooms/${roomId}/questions/${questionId}/likes`).push({
        authorId: user?.id,
      });
    }
  }

  return (
    <RoomContainer>
      <HeaderContainer>
        <div>
          <img
            src={theme.title === 'light' ? logoImg : logoDarkImg}
            alt="Letmeask"
          />
          <div>
            <RoomCode code={roomId} />
            <Button isOutlined aria-label="Inverter tema" onClick={toggleTheme}>
              {theme.title === 'light' ? <FiMoon /> : <FiSun />}
            </Button>
          </div>
        </div>
      </HeaderContainer>

      <main>
        <div>
          <h1>Sala {title}</h1>
          {questions.length > 0 && <span>{questions.length} pergunta(s)</span>}
        </div>

        <FormContainer onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que voc?? quer perguntar?"
            onChange={(event) => setNewQuestion(event.target.value)}
            value={newQuestion}
          />

          <footer>
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>
                Para enviar uma pergunta,{' '}
                <button onClick={signInWithGoogle}>fa??a seu login</button>.
              </span>
            )}
            <Button type="submit" disabled={!user}>
              Enviar pergunta
            </Button>
          </footer>
        </FormContainer>

        <QuestionList>
          {questions.map((question) => {
            return (
              <Question
                key={question.id}
                content={question.content}
                author={question.author}
                isAnswered={question.isAnswered}
                isHighlighted={question.isHighlighted}
              >
                {!question.isAnswered && (
                  <IconButton
                    type="button"
                    aria-label="Marcar como gostei"
                    color={question.likeId ? theme.colors.purple : undefined}
                    onClick={() =>
                      handleLikeQuestion(question.id, question.likeId)
                    }
                  >
                    {question.likeCount > 0 && (
                      <span>{question.likeCount}</span>
                    )}
                    <FiThumbsUp size={24} />
                  </IconButton>
                )}
              </Question>
            );
          })}
        </QuestionList>
      </main>
    </RoomContainer>
  );
};
