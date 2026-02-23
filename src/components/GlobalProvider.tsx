import React, { ReactNode, useEffect } from "react";
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
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const newVar: User = await checkUserAction(user.uid);
          if (newVar) {
            console.log("User found");
            window.localStorage.setItem("nvrUser", JSON.stringify(newVar));
            dispatch(setUser(newVar));
          } else {
            console.error("User not found");
            window.localStorage.removeItem("nvrUser");
            dispatch(setUser(null));
            navigate("/login");
          }
        } catch (e) {
          console.log("Error fetching user", e);
          console.error(e);
          window.localStorage.removeItem("nvrUser");
          dispatch(setUser(null));
          navigate("/login");
        }
      } else {
        console.log("No user found in firebase");
        window.localStorage.removeItem("nvrUser");
        dispatch(setUser(null));
        navigate("/login");
      }
    });
  }, []);
  return <>{children}</>;
};

export default GlobalProvider;
