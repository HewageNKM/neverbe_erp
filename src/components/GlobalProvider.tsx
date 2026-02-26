import React, { ReactNode, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/authSlice/authSlice";
import { onAuthStateChanged } from "@firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { checkUserAction } from "@/actions/authActions";
import { useNavigate } from "react-router-dom";
import { User } from "@/model/User";

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Skip re-fetching if the same user is already loaded
        if (currentUidRef.current === user.uid) return;

        try {
          const newVar: User = await checkUserAction(user.uid);
          if (newVar) {
            console.log("User found");
            currentUidRef.current = user.uid;
            window.localStorage.setItem("nvrUser", JSON.stringify(newVar));
            dispatch(setUser(newVar));
          } else {
            console.error("User not found");
            currentUidRef.current = null;
            window.localStorage.removeItem("nvrUser");
            dispatch(setUser(null));
            navigate("/login");
          }
        } catch (e) {
          console.log("Error fetching user", e);
          console.error(e);
          currentUidRef.current = null;
          window.localStorage.removeItem("nvrUser");
          dispatch(setUser(null));
          navigate("/login");
        }
      } else {
        console.log("No user found in firebase");
        currentUidRef.current = null;
        window.localStorage.removeItem("nvrUser");
        dispatch(setUser(null));
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, []);
  return <>{children}</>;
};

export default GlobalProvider;
